"use client";

import { useState, useMemo, Fragment } from "react";
import MaterialDropdown from "./MaterialDropdown";
import { Download, ChevronRight, ChevronDown, Trash2 } from "lucide-react";
import TotalsSummary from "./TotalsSummary";

interface MaterialOption {
  id: string;
  name: string;
  co2: number;
  ubp: number;
  kwh: number;
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
  density?: number;
  area?: number;
  isReinforcementFor?: number;
}

interface ResultsTableProps {
  data: MaterialData[];
  originalHeaders: string[];
  originalRowData: string[][];
  onUpdateMaterial?: (indices: number[], material: MaterialOption) => void;
  onDeleteRows?: (indices: number[]) => void;
  onUpdateRow?: (index: number, updates: Partial<MaterialData>) => void;
  calculationMode: "co2" | "ubp" | "kwh";
}

interface GroupedData
  extends Omit<MaterialData, "quantity" | "kg" | "co2" | "ubp" | "kwh"> {
  quantity: number;
  kg: number;
  co2: number;
  ubp: number;
  kwh: number;
  rows: number[];
  isExpanded?: boolean;
}

export default function ResultsTable({
  data,
  originalHeaders,
  originalRowData,
  onUpdateMaterial,
  onDeleteRows,
  onUpdateRow,
  calculationMode = "co2",
}: ResultsTableProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [bulkMaterial, setBulkMaterial] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isGrouped, setIsGrouped] = useState(true);
  const [m2Calculations, setM2Calculations] = useState<Record<number, boolean>>(
    {}
  );
  const [showReinforcementDialog, setShowReinforcementDialog] = useState(false);
  const [reinforcementAmount, setReinforcementAmount] = useState<string>("");

  const calculateValues = (item: MaterialData, index: number) => {
    if (m2Calculations[index] && item.area && item.area > 0) {
      return {
        quantity: item.quantity / item.area,
        kg: item.kg / item.area,
        co2: item.co2 / item.area,
        ubp: item.ubp / item.area,
        kwh: item.kwh / item.area,
      };
    }
    return {
      quantity: item.quantity,
      kg: item.kg,
      co2: item.co2,
      ubp: item.ubp,
      kwh: item.kwh,
    };
  };

  const toggleM2Calculation = (index: number) => {
    setM2Calculations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const groupData = (data: MaterialData[]) => {
    if (!isGrouped) return [];

    const groups = data.reduce((acc, row) => {
      const key = `${row.element}-${row.material}`;
      if (!acc[key]) {
        acc[key] = {
          element: row.element,
          material: row.material,
          unit: row.unit,
          quantity: 0,
          kg: 0,
          co2: 0,
          ubp: 0,
          kwh: 0,
          density: row.density || 0,
          matchedMaterial: row.matchedMaterial || "",
          matchScore: row.matchScore || null,
          availableMaterials: row.availableMaterials || [],
          rows: [],
        };
      }
      acc[key].quantity += row.quantity;
      acc[key].kg += row.kg || 0;
      acc[key].co2 += row.co2 || 0;
      acc[key].ubp += row.ubp || 0;
      acc[key].kwh += row.kwh || 0;
      acc[key].rows.push(row);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groups);
  };

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (row) =>
          row.element.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (row.matchedMaterial &&
            row.matchedMaterial
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || 0;
        const bValue = b[sortConfig.key] || 0;
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  const groupedData = useMemo(
    () => groupData(filteredData),
    [filteredData, isGrouped]
  );

  const handleGroupToggle = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRowSelect = (index: number, isChecked: boolean) => {
    setSelectedRows((prev) =>
      isChecked ? [...prev, index] : prev.filter((i) => i !== index)
    );
  };

  const handleSelectAll = (isChecked: boolean) => {
    setSelectedRows(isChecked ? filteredData.map((_, index) => index) : []);
  };

  const handleBulkUpdate = (material: MaterialOption) => {
    if (selectedRows.length > 0 && onUpdateMaterial) {
      onUpdateMaterial(selectedRows, material);
      setSelectedRows([]); // Clear selection after update
      setBulkMaterial(""); // Reset bulk material dropdown
    }
  };

  // Get available materials from the first row (they should all be the same)
  const availableMaterials = filteredData[0]?.availableMaterials || [];

  const handleExportCSV = () => {
    console.log("Starting CSV export", {
      selectedRowsCount: selectedRows.length,
      filteredDataLength: filteredData.length,
      originalDataLength: originalRowData.length,
      originalHeadersCount: originalHeaders.length,
    });

    // Helper function to escape CSV values
    const escapeCSV = (value: string | number) => {
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("'")
      ) {
        // Escape quotes by doubling them and wrap in quotes
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create CSV content
    const csvContent = [
      // Headers: Original headers + new result columns
      [
        ...originalHeaders,
        "KBOB Material",
        "CO2 pro kg (kg CO2 eq/kg)",
        "CO2 Total (kg CO2 eq)",
        "UBP pro kg (pts/kg)",
        "UBP Total (pts)",
        "kWh pro kg (kWh/kg)",
        "kWh Total (kWh)",
      ]
        .map(escapeCSV)
        .join(","),
    ];

    console.log("Created headers", {
      headerRow: csvContent[0],
      originalHeaders,
      totalColumns: originalHeaders.length + 7,
    });

    // Process each row in filteredData
    filteredData.forEach((row, index) => {
      console.log(`Processing row ${index + 1}/${filteredData.length}`, {
        row,
        originalDataLength: originalRowData.length,
      });

      // Get the original data row using the same index
      const originalDataRow = originalRowData[index];
      console.log("Original data row:", {
        index,
        originalDataRow,
        hasOriginalData: !!originalDataRow,
      });

      // Calculate per-kg indicators if available
      const perKgCO2 = row.kg > 0 ? row.co2 / row.kg : 0;
      const perKgUBP = row.kg > 0 ? row.ubp / row.kg : 0;
      const perKgKWH = row.kg > 0 ? row.kwh / row.kg : 0;

      // Create the row data
      const rowData = [
        // Add original data if available, otherwise empty strings
        ...(originalDataRow
          ? originalHeaders.map((header) =>
              escapeCSV(originalDataRow[header] || "")
            )
          : originalHeaders.map(() => "")),
        // Add KBOB material
        escapeCSV(row.matchedMaterial || ""),
        // Add CO2 data
        escapeCSV(perKgCO2.toFixed(3)),
        escapeCSV(row.co2.toFixed(2)),
        // Add UBP data
        escapeCSV(perKgUBP.toFixed(3)),
        escapeCSV(row.ubp.toFixed(2)),
        // Add kWh data
        escapeCSV(perKgKWH.toFixed(3)),
        escapeCSV(row.kwh.toFixed(2)),
      ];

      csvContent.push(rowData.join(","));
      console.log("Added row to CSV", {
        rowIndex: csvContent.length - 1,
        rowData: rowData.join(","),
        hasOriginalData: !!originalDataRow,
      });
    });

    console.log("Final CSV content", {
      totalRows: csvContent.length,
      firstRow: csvContent[0],
      lastRow: csvContent[csvContent.length - 1],
      sample: csvContent.slice(0, Math.min(3, csvContent.length)),
    });

    // Create and trigger download with BOM for Excel compatibility
    const BOM = "\uFEFF"; // Add BOM for proper UTF-8 encoding in Excel
    const blob = new Blob([BOM + csvContent.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const filename =
      selectedRows.length > 0
        ? `lca-results-${selectedRows.length}-selected-${
            new Date().toISOString().split("T")[0]
          }.csv`
        : `lca-results-all-${new Date().toISOString().split("T")[0]}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("Export completed", {
      filename,
      totalRows: csvContent.length,
      fileSize: blob.size,
    });
  };

  const handleUnitChange = async (index: number, unit: "kg" | "m3" | "m2") => {
    if (!onUpdateRow) return;

    const row = data[index];
    const updates: Partial<MaterialData> = { unit };

    if (unit === "m2") {
      updates.matchedMaterial = "";
      updates.matchScore = null;
      updates.availableMaterials = [];
      updates.density = undefined;
    } else {
      try {
        // Fetch KBOB materials when switching to kg or m³
        const response = await fetch("/api/lca-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              element: row.element,
              material: row.material,
              quantity: row.quantity,
              unit: unit,
            },
          ]),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const materialData = result[0];

        updates.availableMaterials = materialData.availableMaterials;
        if (materialData.matchedMaterial) {
          updates.matchedMaterial = materialData.matchedMaterial;
          updates.matchScore = materialData.matchScore;
          updates.co2 = materialData.co2;
          updates.ubp = materialData.ubp;
          updates.kwh = materialData.kwh;
          updates.density = materialData.density;
        }
      } catch (error) {
        console.error("Error fetching KBOB materials:", error);
      }
    }

    onUpdateRow(index, updates);
  };

  const handleDelete = () => {
    if (!selectedRows.length || !onDeleteRows) return;

    const confirmMessage =
      selectedRows.length === 1
        ? "Möchten Sie diese Zeile wirklich löschen?"
        : `Möchten Sie diese ${selectedRows.length} Zeilen wirklich löschen?`;

    if (window.confirm(confirmMessage)) {
      onDeleteRows(selectedRows);
      setSelectedRows([]);
    }
  };

  const handleMaterialSelect = (rowIndex: number, material: MaterialOption) => {
    console.log("ResultsTable handleMaterialSelect:", {
      rowIndex,
      filteredRow: filteredData[rowIndex],
      material,
      totalRows: data.length,
      filteredRows: filteredData.length,
    });

    if (!onUpdateMaterial) return;

    // Find the actual index in the full data array
    const targetRow = filteredData[rowIndex];
    const actualIndex = data.findIndex(
      (row) =>
        row.element === targetRow.element &&
        row.material === targetRow.material &&
        row.quantity === targetRow.quantity &&
        row.unit === targetRow.unit
    );

    console.log("Index mapping:", {
      filteredIndex: rowIndex,
      actualIndex,
      targetRow,
    });

    if (actualIndex !== -1) {
      onUpdateMaterial([actualIndex], material);
    } else {
      console.warn("Could not find matching row in full dataset:", {
        targetRow,
        fullDataLength: data.length,
        sample: data[0],
      });
    }
  };

  const handleAddReinforcement = async () => {
    console.log("Starting handleAddReinforcement", {
      reinforcementAmount,
      selectedRows,
      filteredDataLength: filteredData.length,
      dataLength: data.length,
    });

    if (!reinforcementAmount || selectedRows.length === 0) {
      console.log("No reinforcement amount or no rows selected");
      return;
    }

    const kgPerM3 = parseFloat(reinforcementAmount);
    if (isNaN(kgPerM3)) {
      console.log("Invalid reinforcement amount", { reinforcementAmount });
      return;
    }

    // Get the reinforcement steel material from KBOB data
    const response = await fetch("/api/lca-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          element: "Bewehrung",
          material: "Armierungsstahl",
          quantity: kgPerM3,
          unit: "kg",
        },
      ]),
    });

    if (!response.ok) {
      console.error("KBOB API response not ok", { status: response.status });
      return;
    }

    const result = await response.json();
    const reinforcementMaterial = result[0];
    console.log("Got KBOB data for reinforcement:", reinforcementMaterial);

    // Verify we got valid KBOB data for Armierungsstahl
    if (
      !reinforcementMaterial?.matchedMaterial
        ?.toLowerCase()
        .includes("armierung")
    ) {
      console.error(
        "Invalid KBOB data - no Armierungsstahl found",
        reinforcementMaterial
      );
      alert(
        "Konnte keinen passenden KBOB-Datensatz für Armierungsstahl finden."
      );
      return;
    }

    console.log("Processing selected rows:", selectedRows);

    // Create an array to collect all new rows
    const newRows: MaterialData[] = [];

    // Process each selected row
    for (const concreteRow of selectedRows as MaterialData[]) {
      console.log("Processing concrete row:", { concreteRow });

      if (!concreteRow || concreteRow.unit !== "m3") {
        console.log("Skipping non-concrete row:", {
          element: concreteRow?.element,
          unit: concreteRow?.unit,
        });
        continue;
      }

      // Find the actual index in the full data array
      const actualIndex = data.findIndex(
        (row) =>
          row.element === concreteRow.element &&
          row.material === concreteRow.material &&
          row.quantity === concreteRow.quantity &&
          row.unit === concreteRow.unit
      );

      console.log("Found actual index:", {
        actualIndex,
        concreteRow: concreteRow.element,
      });

      if (actualIndex === -1) {
        console.log("Could not find row in full data, skipping");
        continue;
      }

      // Calculate reinforcement quantity based on concrete volume
      const reinforcementQuantity = concreteRow.quantity * kgPerM3; // m3 * kg/m3 = kg of steel
      console.log("Calculated reinforcement:", {
        concreteVolume: concreteRow.quantity,
        kgPerM3,
        reinforcementQuantity,
        co2PerKg: reinforcementMaterial.co2,
        ubpPerKg: reinforcementMaterial.ubp,
        kwhPerKg: reinforcementMaterial.kwh,
      });

      // Create new row for reinforcement
      const newRow: MaterialData = {
        element: `${concreteRow.element} - Bewehrung ${kgPerM3}kg/m³`,
        material: "Armierungsstahl",
        quantity: reinforcementQuantity,
        unit: "kg",
        kg: reinforcementQuantity,
        // Calculate emissions: kg of steel * indicator per kg
        co2: reinforcementQuantity * reinforcementMaterial.co2,
        ubp: reinforcementQuantity * reinforcementMaterial.ubp,
        kwh: reinforcementQuantity * reinforcementMaterial.kwh,
        matchedMaterial: reinforcementMaterial.matchedMaterial,
        matchScore: reinforcementMaterial.matchScore || 1,
        availableMaterials: reinforcementMaterial.availableMaterials,
        density: reinforcementMaterial.density,
        isReinforcementFor: actualIndex,
      };

      console.log("Created reinforcement row with emissions:", {
        kg: newRow.kg,
        co2: newRow.co2,
        ubp: newRow.ubp,
        kwh: newRow.kwh,
        calculation: {
          co2: `${reinforcementQuantity} kg * ${reinforcementMaterial.co2} CO2/kg = ${newRow.co2} kg CO2`,
          ubp: `${reinforcementQuantity} kg * ${reinforcementMaterial.ubp} UBP/kg = ${newRow.ubp} UBP`,
          kwh: `${reinforcementQuantity} kg * ${reinforcementMaterial.kwh} kWh/kg = ${newRow.kwh} kWh`,
        },
      });

      newRows.push(newRow);
    }

    // Add all new rows
    console.log("Adding new rows:", newRows.length);
    newRows.forEach((newRow, index) => {
      console.log(`Adding row ${index + 1}/${newRows.length}`);
      onUpdateRow?.(data.length + index, newRow);
    });

    console.log("Finished adding reinforcement rows");
    setShowReinforcementDialog(false);
    setReinforcementAmount("");
    setSelectedRows([]);
  };

  return (
    <div className="w-full space-y-6">
      <TotalsSummary
        data={{
          totalMass: filteredData.reduce((sum, row) => sum + row.kg, 0),
          totalCO2: filteredData.reduce((sum, row) => sum + row.co2, 0),
          totalUBP: filteredData.reduce((sum, row) => sum + row.ubp, 0),
          totalEnergy: filteredData.reduce((sum, row) => sum + row.kwh, 0),
          itemCount: filteredData.length,
        }}
      />

      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setIsGrouped(!isGrouped)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#a9b1d6] bg-white dark:bg-[#1a1b26] border border-gray-300 dark:border-[#24283b] rounded-lg hover:bg-gray-50 dark:hover:bg-[#24283b] transition-colors"
          >
            {isGrouped ? "Gruppierung aufheben" : "Ähnliche Zeilen gruppieren"}
          </button>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedRows.length === filteredData.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-[#7aa2f7] dark:text-[#7aa2f7] rounded border-gray-300 dark:border-[#24283b] focus:ring-[#7aa2f7] dark:focus:ring-[#7aa2f7] dark:bg-[#1a1b26]"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-[#a9b1d6]">
              {selectedRows.length} Zeilen ausgewählt
            </span>
          </div>

          {selectedRows.length > 0 && (
            <>
              <div className="flex-1 max-w-md">
                <MaterialDropdown
                  materials={availableMaterials}
                  selectedMaterial={bulkMaterial}
                  onSelect={(material) => {
                    setBulkMaterial(material.name);
                    handleBulkUpdate(material);
                  }}
                  placeholder="Ausgewählte Zeilen aktualisieren..."
                />
              </div>

              <button
                onClick={() => setShowReinforcementDialog(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#a9b1d6] bg-white dark:bg-[#1a1b26] border border-gray-300 dark:border-[#24283b] rounded-lg hover:bg-gray-50 dark:hover:bg-[#24283b] transition-colors"
              >
                Bewehrung hinzufügen
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedRows.length > 0 && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Löschen{" "}
              {selectedRows.length > 1
                ? `${selectedRows.length} Zeilen`
                : "Zeile"}
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            {selectedRows.length > 0
              ? `${selectedRows.length} Ausgewählte exportieren`
              : "Alle Ergebnisse exportieren"}
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-[#24283b] bg-white dark:bg-[#1a1b26] shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-[#24283b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-[#24283b] rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-[#1a1b26] dark:text-[#a9b1d6]"
              />
              <button
                onClick={() => setIsGrouped(!isGrouped)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a9b1d6] hover:text-gray-900 dark:hover:text-white"
              >
                {isGrouped ? "Gruppierung aufheben" : "Gruppieren"}
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (!onUpdateRow) return;
                    selectedRows.forEach((index) =>
                      handleUnitChange(index, "kg")
                    );
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a9b1d6] bg-white dark:bg-[#1a1b26] border border-gray-300 dark:border-[#24283b] rounded-md hover:bg-gray-50 dark:hover:bg-[#24283b]"
                >
                  Als kg
                </button>
                <button
                  onClick={() => {
                    if (!onUpdateRow) return;
                    selectedRows.forEach((index) =>
                      handleUnitChange(index, "m3")
                    );
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a9b1d6] bg-white dark:bg-[#1a1b26] border border-gray-300 dark:border-[#24283b] rounded-md hover:bg-gray-50 dark:hover:bg-[#24283b]"
                >
                  Als m³
                </button>
                <button
                  onClick={() => {
                    if (!onUpdateRow) return;
                    selectedRows.forEach((index) =>
                      handleUnitChange(index, "m2")
                    );
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a9b1d6] bg-white dark:bg-[#1a1b26] border border-gray-300 dark:border-[#24283b] rounded-md hover:bg-gray-50 dark:hover:bg-[#24283b]"
                >
                  Als m²
                </button>
              </div>
            </div>
          </div>
        </div>
        <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-[#24283b]">
          <thead className="bg-gray-50 dark:bg-[#24283b]">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#292e42]"
                onClick={() => handleSort("element")}
              >
                Bauteil{" "}
                {sortConfig?.key === "element" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#292e42]"
                onClick={() => handleSort("material")}
              >
                Original Material{" "}
                {sortConfig?.key === "material" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#292e42]"
                onClick={() => handleSort("matchedMaterial")}
              >
                KBOB Material{" "}
                {sortConfig?.key === "matchedMaterial" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider">
                Einheit
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#292e42]"
                onClick={() => handleSort("quantity")}
              >
                Menge{" "}
                {sortConfig?.key === "quantity" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#292e42]"
                onClick={() => handleSort("density")}
              >
                Dichte{" "}
                {sortConfig?.key === "density" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#292e42]"
                onClick={() => handleSort("kg")}
              >
                kg{" "}
                {sortConfig?.key === "kg" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#292e42]"
                onClick={() => handleSort("co2")}
              >
                kg CO₂{" "}
                {sortConfig?.key === "co2" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#292e42]"
                onClick={() => handleSort("ubp")}
              >
                UBP{" "}
                {sortConfig?.key === "ubp" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#a9b1d6] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#292e42]"
                onClick={() => handleSort("kwh")}
              >
                kWh{" "}
                {sortConfig?.key === "kwh" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1a1b26] divide-y divide-gray-200 dark:divide-[#24283b]">
            {isGrouped && groupedData
              ? groupedData.map((group) => {
                  const key = `${group.element}-${group.material}`;
                  return (
                    <Fragment key={key}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-[#292e42]">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={group.rows.every((i) =>
                              selectedRows.includes(i)
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRows((prev) => [
                                  ...prev,
                                  ...group.rows,
                                ]);
                              } else {
                                setSelectedRows((prev) =>
                                  prev.filter((i) => !group.rows.includes(i))
                                );
                              }
                            }}
                            className="h-4 w-4 text-[#7aa2f7] dark:text-[#7aa2f7] rounded border-gray-300 dark:border-[#24283b] focus:ring-[#7aa2f7] dark:focus:ring-[#7aa2f7] dark:bg-[#1a1b26]"
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-[#a9b1d6]">
                          {group.element}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-[#a9b1d6]">
                          {group.material}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-[#a9b1d6]">
                          {group.unit === "m2" ? (
                            group.material
                          ) : (
                            <MaterialDropdown
                              materials={group.availableMaterials || []}
                              selectedMaterial={group.matchedMaterial}
                              onSelect={(material) => {
                                if (onUpdateMaterial) {
                                  onUpdateMaterial(group.rows, {
                                    id: material.id,
                                    name: material.name,
                                    co2: material.co2,
                                    ubp: material.ubp,
                                    kwh: material.kwh,
                                    density: material.density,
                                  });
                                }
                              }}
                              showDensity={group.unit === "m3"}
                            />
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <select
                            value={group.unit}
                            onChange={(e) =>
                              handleUnitChange(
                                group.rows[0],
                                e.target.value as "kg" | "m3" | "m2"
                              )
                            }
                            className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-[#24283b] bg-white dark:bg-[#1a1b26] text-gray-900 dark:text-[#a9b1d6]"
                          >
                            <option value="kg">kg</option>
                            <option value="m3">m³</option>
                            <option value="m2">m²</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900 dark:text-[#a9b1d6]">
                          {group.quantity.toFixed(2)} {group.unit}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900 dark:text-[#a9b1d6]">
                          {group.unit === "m3"
                            ? group.density?.toFixed(2) || "N/A"
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900 dark:text-[#a9b1d6]">
                          {group.kg.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right relative group">
                          <span className="text-gray-900 dark:text-[#a9b1d6]">
                            {group.co2.toFixed(2)}
                          </span>
                          {group.matchedMaterial && (
                            <div className="absolute hidden group-hover:block z-10 bg-white dark:bg-[#24283b] border border-gray-200 dark:border-[#1a1b26] rounded-lg p-2 shadow-lg -translate-y-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                              <p className="text-sm text-gray-600 dark:text-[#a9b1d6]">
                                {group.matchedMaterial}:<br />
                                {(group.co2 / group.kg).toFixed(2)} kg CO₂/kg
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right relative group">
                          <span className="text-gray-900 dark:text-[#a9b1d6]">
                            {group.ubp.toFixed(2)}
                          </span>
                          {group.matchedMaterial && (
                            <div className="absolute hidden group-hover:block z-10 bg-white dark:bg-[#24283b] border border-gray-200 dark:border-[#1a1b26] rounded-lg p-2 shadow-lg -translate-y-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                              <p className="text-sm text-gray-600 dark:text-[#a9b1d6]">
                                {group.matchedMaterial}:<br />
                                {(group.ubp / group.kg).toFixed(2)} UBP/kg
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right relative group">
                          <span className="text-gray-900 dark:text-[#a9b1d6]">
                            {group.kwh.toFixed(2)}
                          </span>
                          {group.matchedMaterial && (
                            <div className="absolute hidden group-hover:block z-10 bg-white dark:bg-[#24283b] border border-gray-200 dark:border-[#1a1b26] rounded-lg p-2 shadow-lg -translate-y-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                              <p className="text-sm text-gray-600 dark:text-[#a9b1d6]">
                                {group.matchedMaterial}:<br />
                                {(group.kwh / group.kg).toFixed(2)} kWh/kg
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleGroupToggle(key)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {expandedGroups[key] &&
                        group.rows.map((index) => (
                          <tr
                            key={`${key}-${index}`}
                            className="bg-gray-50 dark:bg-[#292e42]"
                          >
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(index)}
                                onChange={(e) =>
                                  handleRowSelect(index, e.target.checked)
                                }
                                className="h-4 w-4 text-[#7aa2f7] dark:text-[#7aa2f7] rounded border-gray-300 dark:border-[#24283b] focus:ring-[#7aa2f7] dark:focus:ring-[#7aa2f7] dark:bg-[#1a1b26]"
                              />
                            </td>
                            <td className="px-4 py-2 text-gray-900 dark:text-[#a9b1d6]">
                              {filteredData[index].element}
                            </td>
                            <td className="px-4 py-2 text-gray-900 dark:text-[#a9b1d6]">
                              {filteredData[index].material}
                            </td>
                            <td className="px-4 py-2 text-gray-900 dark:text-[#a9b1d6]">
                              {filteredData[index].unit === "m2" ? (
                                filteredData[index].material
                              ) : (
                                <MaterialDropdown
                                  materials={
                                    filteredData[index].availableMaterials || []
                                  }
                                  selectedMaterial={
                                    filteredData[index].matchedMaterial
                                  }
                                  onSelect={(material) =>
                                    handleMaterialSelect(index, material)
                                  }
                                  showDensity={
                                    filteredData[index].unit === "m3"
                                  }
                                />
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <select
                                value={filteredData[index].unit}
                                onChange={(e) =>
                                  handleUnitChange(
                                    index,
                                    e.target.value as "kg" | "m3" | "m2"
                                  )
                                }
                                className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-[#24283b] bg-white dark:bg-[#1a1b26] text-gray-900 dark:text-[#a9b1d6]"
                              >
                                <option value="kg">kg</option>
                                <option value="m3">m³</option>
                                <option value="m2">m²</option>
                              </select>
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 dark:text-[#a9b1d6]">
                              {calculateValues(
                                filteredData[index],
                                index
                              ).quantity.toFixed(2)}{" "}
                              {filteredData[index].unit}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 dark:text-[#a9b1d6]">
                              {filteredData[index].unit === "m3"
                                ? filteredData[index].density?.toFixed(2) ||
                                  "N/A"
                                : "-"}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 dark:text-[#a9b1d6]">
                              {calculateValues(
                                filteredData[index],
                                index
                              ).kg.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right relative group">
                              <span className="text-gray-900 dark:text-[#a9b1d6]">
                                {calculateValues(
                                  filteredData[index],
                                  index
                                ).co2.toFixed(2)}
                              </span>
                              {filteredData[index].matchedMaterial && (
                                <div className="absolute hidden group-hover:block z-10 bg-white dark:bg-[#24283b] border border-gray-200 dark:border-[#1a1b26] rounded-lg p-2 shadow-lg -translate-y-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                                  <p className="text-sm text-gray-600 dark:text-[#a9b1d6]">
                                    {filteredData[index].matchedMaterial}:<br />
                                    {(
                                      calculateValues(
                                        filteredData[index],
                                        index
                                      ).co2 /
                                      calculateValues(
                                        filteredData[index],
                                        index
                                      ).kg
                                    ).toFixed(2)}{" "}
                                    kg CO₂/kg
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right relative group">
                              <span className="text-gray-900 dark:text-[#a9b1d6]">
                                {calculateValues(
                                  filteredData[index],
                                  index
                                ).ubp.toFixed(2)}
                              </span>
                              {filteredData[index].matchedMaterial && (
                                <div className="absolute hidden group-hover:block z-10 bg-white dark:bg-[#24283b] border border-gray-200 dark:border-[#1a1b26] rounded-lg p-2 shadow-lg -translate-y-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                                  <p className="text-sm text-gray-600 dark:text-[#a9b1d6]">
                                    {filteredData[index].matchedMaterial}:<br />
                                    {(
                                      calculateValues(
                                        filteredData[index],
                                        index
                                      ).ubp /
                                      calculateValues(
                                        filteredData[index],
                                        index
                                      ).kg
                                    ).toFixed(2)}{" "}
                                    UBP/kg
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right relative group">
                              <span className="text-gray-900 dark:text-[#a9b1d6]">
                                {calculateValues(
                                  filteredData[index],
                                  index
                                ).kwh.toFixed(2)}
                              </span>
                              {filteredData[index].matchedMaterial && (
                                <div className="absolute hidden group-hover:block z-10 bg-white dark:bg-[#24283b] border border-gray-200 dark:border-[#1a1b26] rounded-lg p-2 shadow-lg -translate-y-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                                  <p className="text-sm text-gray-600 dark:text-[#a9b1d6]">
                                    {filteredData[index].matchedMaterial}:<br />
                                    {(
                                      calculateValues(
                                        filteredData[index],
                                        index
                                      ).kwh /
                                      calculateValues(
                                        filteredData[index],
                                        index
                                      ).kg
                                    ).toFixed(2)}{" "}
                                    kWh/kg
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => toggleM2Calculation(index)}
                                className={`px-2 py-1 text-xs font-medium rounded ${
                                  m2Calculations[index]
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                }`}
                              >
                                {m2Calculations[index] ? "Pro m²" : "Absolut"}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })
              : // Original row rendering
                filteredData.map((row, index) => (
                  <tr
                    key={`${row.element}-${row.material}-${row.quantity}-${index}`}
                    className={`hover:bg-gray-50 dark:hover:bg-[#292e42] ${
                      selectedRows.includes(index)
                        ? "bg-blue-50 dark:bg-[#24283b]"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(index)}
                        onChange={(e) =>
                          handleRowSelect(e.target.checked, index)
                        }
                        className="h-4 w-4 text-[#7aa2f7] dark:text-[#7aa2f7] rounded border-gray-300 dark:border-[#24283b] focus:ring-[#7aa2f7] dark:focus:ring-[#7aa2f7] dark:bg-[#1a1b26]"
                      />
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-[#a9b1d6]">
                      {row.element}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-[#a9b1d6]">
                      {row.material}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-[#a9b1d6]">
                      {row.unit === "m2" ? (
                        row.material
                      ) : (
                        <MaterialDropdown
                          materials={row.availableMaterials || []}
                          selectedMaterial={row.matchedMaterial}
                          onSelect={(material) =>
                            handleMaterialSelect(index, material)
                          }
                          showDensity={row.unit === "m3"}
                        />
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <select
                        value={row.unit}
                        onChange={(e) =>
                          handleUnitChange(
                            index,
                            e.target.value as "kg" | "m3" | "m2"
                          )
                        }
                        className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-[#24283b] bg-white dark:bg-[#1a1b26] text-gray-900 dark:text-[#a9b1d6]"
                      >
                        <option value="kg">kg</option>
                        <option value="m3">m³</option>
                        <option value="m2">m²</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900 dark:text-[#a9b1d6]">
                      {row.quantity.toFixed(2)} {row.unit}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900 dark:text-[#a9b1d6]">
                      {row.unit === "m3"
                        ? row.density?.toFixed(2) || "N/A"
                        : "-"}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900 dark:text-[#a9b1d6]">
                      {row.kg.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right relative group">
                      <span className="text-gray-900 dark:text-[#a9b1d6]">
                        {row.co2.toFixed(2)}
                      </span>
                      {row.matchedMaterial && (
                        <div className="absolute hidden group-hover:block z-10 bg-white dark:bg-[#24283b] border border-gray-200 dark:border-[#1a1b26] rounded-lg p-2 shadow-lg -translate-y-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <p className="text-sm text-gray-600 dark:text-[#a9b1d6]">
                            {row.matchedMaterial}:<br />
                            {(row.co2 / row.kg).toFixed(2)} kg CO₂/kg
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right relative group">
                      <span className="text-gray-900 dark:text-[#a9b1d6]">
                        {row.ubp.toFixed(2)}
                      </span>
                      {row.matchedMaterial && (
                        <div className="absolute hidden group-hover:block z-10 bg-white dark:bg-[#24283b] border border-gray-200 dark:border-[#1a1b26] rounded-lg p-2 shadow-lg -translate-y-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <p className="text-sm text-gray-600 dark:text-[#a9b1d6]">
                            {row.matchedMaterial}:<br />
                            {(row.ubp / row.kg).toFixed(2)} UBP/kg
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right relative group">
                      <span className="text-gray-900 dark:text-[#a9b1d6]">
                        {row.kwh.toFixed(2)}
                      </span>
                      {row.matchedMaterial && (
                        <div className="absolute hidden group-hover:block z-10 bg-white dark:bg-[#24283b] border border-gray-200 dark:border-[#1a1b26] rounded-lg p-2 shadow-lg -translate-y-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <p className="text-sm text-gray-600 dark:text-[#a9b1d6]">
                            {row.matchedMaterial}:<br />
                            {(row.kwh / row.kg).toFixed(2)} kWh/kg
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => toggleM2Calculation(index)}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          m2Calculations[index]
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {m2Calculations[index] ? "Pro m²" : "Absolut"}
                      </button>
                    </td>
                    <td className="px-4 py-2"></td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {showReinforcementDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1b26] p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-[#a9b1d6] mb-4">
              Bewehrung hinzufügen
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="reinforcement"
                  className="block text-sm font-medium text-gray-700 dark:text-[#a9b1d6] mb-1"
                >
                  kg Armierungsstahl pro m³
                </label>
                <input
                  type="number"
                  id="reinforcement"
                  value={reinforcementAmount}
                  onChange={(e) => setReinforcementAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#24283b] rounded-md shadow-sm focus:ring-[#7aa2f7] focus:border-[#7aa2f7] dark:bg-[#1a1b26] dark:text-[#a9b1d6]"
                  placeholder="z.B. 100"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowReinforcementDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#a9b1d6] bg-white dark:bg-[#1a1b26] border border-gray-300 dark:border-[#24283b] rounded-lg hover:bg-gray-50 dark:hover:bg-[#24283b] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAddReinforcement}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#7aa2f7] rounded-lg hover:bg-[#6a92e7] transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
