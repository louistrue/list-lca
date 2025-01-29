"use client";

import { useState } from "react";
import CSVUploader from "./CSVUploader";
import ColumnMapper from "./ColumnMapper";
import ResultsTable from "./ResultsTable";
import { Settings } from "lucide-react";

interface MaterialOption {
  id: string;
  name: string;
  co2: number;
  ubp: number;
  kwh: number;
  density: number;
}

interface MaterialData {
  element: string;
  material: string;
  quantity: number;
  unit: "kg" | "m3" | "m2";
  kg: number;
  co2: number;
  ubp: number;
  kwh: number;
  matchedMaterial: string;
  matchScore: number | null;
  availableMaterials: MaterialOption[];
  density: number;
}

interface LCADataInput {
  element: string;
  material: string;
  quantity: number;
  unit: "kg" | "m3" | "m2";
}

interface ColumnMap {
  element: string;
  material: string;
  quantity: string;
}

export default function ConstructionLCACalculator() {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({
    element: "",
    material: "",
    quantity: "",
  });
  const [materialData, setMaterialData] = useState<MaterialData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [originalRowData, setOriginalRowData] = useState<
    Record<string, string>[]
  >([]);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [calculationMode, setCalculationMode] = useState<"absolute" | "per_m2">(
    "absolute"
  );

  const handleCSVUpload = (data: string[][], headers: string[]) => {
    setCsvData(data);
    setCsvHeaders(headers);
    // Store complete original row data
    const rowData = data.map((row) => {
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowObj[header] = row[index];
      });
      return rowObj;
    });
    setOriginalRowData(rowData);
    setShowColumnMapper(true); // Show column mapper after CSV upload
  };

  const handleColumnMap = async (mapping: ColumnMap) => {
    setIsLoading(true);
    setError(null);
    try {
      const mappedData = csvData.map((row) => {
        const element = row[csvHeaders.indexOf(mapping.element)];
        const material = row[csvHeaders.indexOf(mapping.material)];
        const quantityValue =
          parseFloat(row[csvHeaders.indexOf(mapping.quantity)]) || 0;

        return {
          element,
          material,
          quantity: quantityValue,
          unit: "m3" as const,
          kg: quantityValue,
          co2: 0,
          ubp: 0,
          kwh: 0,
          matchedMaterial: "",
          matchScore: null,
          availableMaterials: [],
          density: 0,
        };
      });

      const dataWithLCA = await fetchLCAData(mappedData);
      setMaterialData(dataWithLCA);
      setShowColumnMapper(false);
      setError(null);
    } catch (error) {
      console.error("Error mapping columns:", error);
      setError(
        "An error occurred while processing the data. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLCAData = async (
    data: LCADataInput[]
  ): Promise<MaterialData[]> => {
    try {
      const response = await fetch("/api/lca-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("Error fetching LCA data:", error);
      setError(
        `Failed to fetch LCA data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return data.map(
        (item: LCADataInput): MaterialData => ({
          ...item,
          co2: 0,
          ubp: 0,
          kwh: 0,
          kg: item.quantity,
          matchedMaterial: "Error fetching data",
          matchScore: null,
          availableMaterials: [],
        })
      );
    }
  };

  const handleUpdateMaterial = async (
    indices: number[],
    material: MaterialOption
  ) => {
    console.log("ConstructionLCACalculator handleUpdateMaterial:", {
      indices,
      material,
      materialDataLength: materialData.length,
      firstIndex: indices[0],
    });

    // Convert any potential objects to their numeric indices
    const validIndices = indices
      .map((index) => {
        if (typeof index === "object" && index !== null) {
          // If we got a row object, try to find its index
          const rowIndex = materialData.findIndex(
            (row) =>
              row.element === index.element &&
              row.material === index.material &&
              row.quantity === index.quantity &&
              row.unit === index.unit
          );
          console.log("Converted object to index:", {
            object: index,
            foundIndex: rowIndex,
          });
          return rowIndex;
        }
        return index;
      })
      .filter((index): index is number => {
        const isValid =
          typeof index === "number" &&
          Number.isInteger(index) &&
          index >= 0 &&
          index < materialData.length;

        if (!isValid) {
          console.warn("Invalid index after conversion:", index);
        }
        return isValid;
      });

    if (validIndices.length === 0) {
      console.warn("No valid indices after conversion:", indices);
      return;
    }

    console.log("Using valid indices:", validIndices);

    const updatedData = [...materialData];
    validIndices.forEach((index) => {
      const row = updatedData[index];
      console.log("Processing row update:", {
        index,
        rowExists: !!row,
        rowData: row,
      });

      if (!row) {
        console.warn("No row found at index:", index);
        return;
      }

      // Create a new row object while preserving all existing properties
      const updatedRow = {
        ...row,
        matchedMaterial: material.name,
        density: material.density,
        kg: row.unit === "m3" ? row.quantity * material.density : row.quantity,
      };

      // Update calculations
      updatedRow.co2 = updatedRow.kg * material.co2;
      updatedRow.ubp = updatedRow.kg * material.ubp;
      updatedRow.kwh = updatedRow.kg * material.kwh;

      // Assign the updated row back to the array
      updatedData[index] = updatedRow;

      console.log("Row updated:", {
        index,
        updatedRow,
      });
    });

    console.log("Setting updated data:", {
      dataLength: updatedData.length,
      updatedIndices: validIndices,
      sampleUpdatedRow:
        validIndices.length > 0 ? updatedData[validIndices[0]] : null,
    });

    setMaterialData(updatedData);
  };

  const handleDeleteRows = (indices: number[]) => {
    setMaterialData((prevData) => {
      const newData = [...prevData];
      indices.sort((a, b) => b - a); // Sort in descending order to remove from end first
      indices.forEach((index) => {
        if (index >= 0 && index < newData.length) {
          newData.splice(index, 1);
        }
      });
      return newData;
    });

    // Also update original data
    setOriginalRowData((prevData) => {
      const newData = [...prevData];
      indices.sort((a, b) => b - a); // Sort in descending order to remove from end first
      indices.forEach((index) => {
        if (index >= 0 && index < newData.length) {
          newData.splice(index, 1);
        }
      });
      return newData;
    });
  };

  const handleRowUpdate = (index: number, updates: Partial<MaterialData>) => {
    setMaterialData((prevData) => {
      const newData = [...prevData];
      if (index >= newData.length) {
        // If the index is beyond the current array length, we're adding a new row
        newData.push(updates as MaterialData);
      } else {
        // Otherwise, we're updating an existing row
        newData[index] = { ...newData[index], ...updates };
      }
      return newData;
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {csvHeaders.length === 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-[#a9b1d6]">
                Ökobilanz Berechnung
              </h2>
            </div>
            <CSVUploader
              onUpload={handleCSVUpload}
              onHeadersChange={setCsvHeaders}
            />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-[#a9b1d6]">
                Ökobilanz Berechnung
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowColumnMapper(!showColumnMapper)}
                  className="text-sm text-gray-600 dark:text-[#787c99] hover:text-gray-900 dark:hover:text-[#a9b1d6] transition-colors"
                >
                  {showColumnMapper
                    ? "Ergebnisse anzeigen"
                    : "Spalten zuordnen"}
                </button>
                <button
                  onClick={() => {
                    setCsvHeaders([]);
                    setCsvData([]);
                    setColumnMap({ element: "", material: "", quantity: "" });
                    setShowColumnMapper(false);
                  }}
                  className="text-sm text-gray-600 dark:text-[#787c99] hover:text-gray-900 dark:hover:text-[#a9b1d6] transition-colors"
                >
                  Andere Datei hochladen
                </button>
              </div>
            </div>

            {showColumnMapper ? (
              <div className="w-full bg-gray-50 dark:bg-[#24283b] p-8 rounded-lg border border-gray-200 dark:border-[#1a1b26]">
                <div className="grid grid-cols-2 gap-8">
                  {/* Left side: Column Mapping */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-[#a9b1d6] mb-4">
                      Spalten zuordnen
                    </h3>
                    <ColumnMapper
                      headers={csvHeaders}
                      onMapColumns={handleColumnMap}
                      columnMap={columnMap}
                      initialUnit="m3"
                      onColumnSelect={(type, value) => {
                        setColumnMap((prev) => ({ ...prev, [type]: value }));
                      }}
                    />
                  </div>

                  {/* Right side: Data Preview */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-[#a9b1d6] mb-4">
                      Datenvorschau
                    </h3>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="bg-white dark:bg-[#1a1b26] sticky top-0">
                          <tr>
                            {csvHeaders.map((header, index) => (
                              <th
                                key={index}
                                className={`p-2 text-left border-b border-gray-200 dark:border-[#24283b] relative ${
                                  header === columnMap.element
                                    ? "bg-blue-100/80 dark:bg-blue-900/30"
                                    : header === columnMap.material
                                    ? "bg-green-100/80 dark:bg-green-900/30"
                                    : header === columnMap.quantity
                                    ? "bg-purple-100/80 dark:bg-purple-900/30"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {header}
                                  {header === columnMap.element && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-blue-500 dark:border-blue-600 text-blue-500 dark:text-blue-600 text-xs font-medium">
                                      1
                                    </span>
                                  )}
                                  {header === columnMap.material && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-green-500 dark:border-green-600 text-green-500 dark:text-green-600 text-xs font-medium">
                                      2
                                    </span>
                                  )}
                                  {header === columnMap.quantity && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-purple-500 dark:border-purple-600 text-purple-500 dark:text-purple-600 text-xs font-medium">
                                      3
                                    </span>
                                  )}
                                </div>
                                {header === columnMap.element && (
                                  <div className="absolute inset-0 border-2 border-blue-300 dark:border-blue-600 rounded pointer-events-none" />
                                )}
                                {header === columnMap.material && (
                                  <div className="absolute inset-0 border-2 border-green-300 dark:border-green-600 rounded pointer-events-none" />
                                )}
                                {header === columnMap.quantity && (
                                  <div className="absolute inset-0 border-2 border-purple-300 dark:border-purple-600 rounded pointer-events-none" />
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className="border-b border-gray-200 dark:border-[#24283b]"
                            >
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className={`p-2 relative ${
                                    csvHeaders[cellIndex] === columnMap.element
                                      ? "bg-blue-100/80 dark:bg-blue-900/30"
                                      : csvHeaders[cellIndex] ===
                                        columnMap.material
                                      ? "bg-green-100/80 dark:bg-green-900/30"
                                      : csvHeaders[cellIndex] ===
                                        columnMap.quantity
                                      ? "bg-purple-100/80 dark:bg-purple-900/30"
                                      : ""
                                  }`}
                                >
                                  {cell}
                                  {csvHeaders[cellIndex] ===
                                    columnMap.element && (
                                    <div className="absolute inset-0 border-2 border-blue-300 dark:border-blue-600 rounded pointer-events-none" />
                                  )}
                                  {csvHeaders[cellIndex] ===
                                    columnMap.material && (
                                    <div className="absolute inset-0 border-2 border-green-300 dark:border-green-600 rounded pointer-events-none" />
                                  )}
                                  {csvHeaders[cellIndex] ===
                                    columnMap.quantity && (
                                    <div className="absolute inset-0 border-2 border-purple-300 dark:border-purple-600 rounded pointer-events-none" />
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvData.length > 5 && (
                        <p className="text-sm text-gray-500 dark:text-[#565f89] mt-2 text-center">
                          Zeigt die ersten 5 von {csvData.length} Zeilen
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : materialData.length > 0 ? (
              <ResultsTable
                data={materialData}
                originalHeaders={csvHeaders}
                originalRowData={originalRowData}
                onUpdateMaterial={handleUpdateMaterial}
                onDeleteRows={handleDeleteRows}
                onUpdateRow={handleRowUpdate}
                calculationMode="co2"
              />
            ) : null}

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7aa2f7]"></div>
                <span className="ml-3 text-gray-600 dark:text-[#787c99]">
                  Daten werden verarbeitet...
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
