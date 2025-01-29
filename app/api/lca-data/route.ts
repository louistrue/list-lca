import { NextResponse } from "next/server";
import Fuse from "fuse.js";

const LCA_API_URL = "https://www.lcadata.ch/api/kbob/materials?pageSize=all";
const LCADATA_API_KEY = process.env.LCADATA_API_KEY;

if (!LCADATA_API_KEY) {
  console.warn("Warning: LCADATA_API_KEY is not set in environment variables");
}

interface Material {
  uuid: string;
  nameDE: string;
  nameFR: string;
  density: string;
  unit: string;
  ubp21Total: number | null;
  gwpTotal: number | null;
  primaryEnergyNonRenewableTotal: number | null;
}

interface KBOBMaterial {
  uuid: string;
  nameDE: string;
  density: string;
  ubp21Total: number | null;
  gwpTotal: number | null;
  primaryEnergyNonRenewableTotal: number | null;
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Validate input data
    if (!Array.isArray(data)) {
      throw new Error("Invalid input: data must be an array");
    }

    // Clean and validate the data
    const cleanedData = data.map((item, index) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Invalid item at index ${index}: must be an object`);
      }

      return {
        element: item.element || `Unknown Element ${index + 1}`,
        material: item.material || `Unknown Material ${index + 1}`,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || "kg",
      };
    });

    const fetchLCAData = async (): Promise<KBOBMaterial[]> => {
      try {
        if (!LCADATA_API_KEY) {
          throw new Error("API key is not configured in environment variables");
        }

        try {

          const response = await fetch(LCA_API_URL, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "x-api-key": ` ${LCADATA_API_KEY}`,
            },
            cache: "no-store",
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("API error:", response.status, errorText);
            throw new Error(`API error: ${response.status} ${errorText}`);
          }

          const result = await response.json();

          if (!result.materials || !Array.isArray(result.materials)) {
            console.error("Invalid API response format:", result);
            throw new Error("Invalid API response format");
          }

          return result.materials;
        } catch (networkError) {
          if (
            networkError instanceof TypeError &&
            networkError.message === "fetch failed"
          ) {
            console.error(
              "Network error - Unable to reach the API endpoint:",
              networkError
            );
            throw new Error(
              "Unable to connect to the LCA data service. Please check your internet connection and try again."
            );
          }
          throw networkError;
        }
      } catch (error) {
        console.error("Error fetching LCA data:", error);
        throw error;
      }
    };

    const lcaMaterials = await fetchLCAData();
    console.log("Total materials fetched:", lcaMaterials.length);

    // Helper function to find best material match
    function findBestMaterialMatch(
      searchTerm: string,
      materials: KBOBMaterial[]
    ): { material: KBOBMaterial | null; score: number } {
      const normalizedSearch = searchTerm.toLowerCase().trim();

      // Common material mappings with keywords and preferred materials
      const materialMappings: { [key: string]: { keywords: string[], preferredTypes?: string[] } } = {
        "betonfertigteil": {
          keywords: ["fertigteil", "vorfabriziert", "betonfertigteil"],
          preferredTypes: ["Betonfertigteil"]
        },
        "beton": {
          keywords: ["beton", "concrete", "zement"],
          preferredTypes: ["Hochbaubeton"]
        },
        "bewehrung": {
          keywords: ["bewehrung", "armierung", "stahl"],
          preferredTypes: ["Armierungsstahl"]
        },
        "mauerwerk": {
          keywords: ["mauerwerk", "mauer", "ziegel"],
          preferredTypes: ["Backstein"]
        },
        "holz": {
          keywords: ["holz", "wood", "timber"],
          preferredTypes: ["Brettschichtholz"]
        }
      };

      let bestMatch: KBOBMaterial | null = null;
      let bestScore = 0;

      materials.forEach((material) => {
        const materialName = material.nameDE.toLowerCase();
        let score = 0;

        // Check for exact matches first
        if (materialName === normalizedSearch) {
          score = 1;
        } else {
          // Check material type mappings
          for (const [type, { keywords, preferredTypes }] of Object.entries(materialMappings)) {
            if (normalizedSearch.includes(type)) {
              // Check if this is a preferred material type
              if (preferredTypes?.some(pt => material.nameDE.includes(pt))) {
                score = Math.max(score, 0.9);
              }

              // Check for keyword matches
              keywords.forEach(keyword => {
                if (materialName.includes(keyword)) {
                  score = Math.max(score, 0.8);
                }
              });
            }
          }

          // If no mapping match, do fuzzy matching
          if (score === 0) {
            const words = normalizedSearch.split(/\s+/);
            words.forEach(word => {
              if (materialName.includes(word)) {
                score += 0.3;
              }
            });
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = material;
        }
      });

      return { material: bestMatch, score: bestScore };
    }

    // Process each input item
    const processedItems = cleanedData.map((item) => {
      const searchTerm = item.material.toLowerCase();
      const { material: matchedMaterial, score: matchScore } = findBestMaterialMatch(
        searchTerm,
        lcaMaterials
      );

      const isGoodMatch = matchScore >= 0.8;
      const kg =
        item.unit === "m3" && matchedMaterial
          ? item.quantity * parseFloat(matchedMaterial.density || "0")
          : item.quantity;

      // Filter relevant materials based on type
      const relevantMaterials = lcaMaterials.filter(m => {
        const name = m.nameDE.toLowerCase();
        const searchTermL = searchTerm.toLowerCase();

        // Match based on material type
        if (searchTermL.includes('betonfertigteil')) {
          return name.includes('fertigteil') || name.includes('vorfabriziert');
        }
        if (searchTermL.includes('beton')) {
          return name.includes('beton') || name.includes('concrete');
        }
        if (searchTermL.includes('bewehrung')) {
          return name.includes('bewehrung') || name.includes('armierung');
        }
        if (searchTermL.includes('mauerwerk')) {
          return name.includes('mauerwerk') || name.includes('mauer');
        }
        if (searchTermL.includes('holz')) {
          return name.includes('holz') || name.includes('wood');
        }

        // Default to showing all materials
        return true;
      });

      return {
        ...item,
        kg,
        density: matchedMaterial
          ? parseFloat(matchedMaterial.density || "0")
          : 0,
        co2:
          isGoodMatch && matchedMaterial
            ? (matchedMaterial.gwpTotal ?? 0) * kg
            : 0,
        ubp:
          isGoodMatch && matchedMaterial
            ? (matchedMaterial.ubp21Total ?? 0) * kg
            : 0,
        kwh:
          isGoodMatch && matchedMaterial
            ? (matchedMaterial.primaryEnergyNonRenewableTotal ?? 0) * kg
            : 0,
        matchedMaterial:
          isGoodMatch && matchedMaterial
            ? matchedMaterial.nameDE
            : null,
        matchScore,
        searchTerm,
        availableMaterials: relevantMaterials.map((m) => ({
          id: m.uuid,
          name: m.nameDE,
          density: parseFloat(m.density || "0"),
          co2: m.gwpTotal ?? 0,
          ubp: m.ubp21Total ?? 0,
          kwh: m.primaryEnergyNonRenewableTotal ?? 0,
        })),
      };
    });

    return NextResponse.json(processedItems);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
