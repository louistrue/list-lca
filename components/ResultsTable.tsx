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
  kg: number;
  co2: number;
  ubp: number;
  kwh: number;
  matchedMaterial: string;
  matchScore: number | null;
  availableMaterials: MaterialOption[];
  unit: string;
  density?: number;
}

interface ResultsTableProps {
  data: MaterialData[];
  originalHeaders: string[];
  originalRowData: Record<string, string>[];
  onUpdateMaterial?: (indices: number[], material: MaterialOption) => void;
  onDeleteRows?: (indices: number[]) => void;
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
}: ResultsTableProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [bulkMaterial, setBulkMaterial] = useState<string>("");
  const [isGrouped, setIsGrouped] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  // Group data by element and material
  const groupedData = useMemo(() => {
    if (!isGrouped) return null;

    const groups: Record<string, GroupedData> = {};

    data.forEach((row, index) => {
      const key = `${row.element}|${row.material}`;

      if (!groups[key]) {
        groups[key] = {
          ...row,
          quantity: row.quantity,
          kg: row.kg,
          co2: row.co2,
          ubp: row.ubp,
          kwh: row.kwh,
          rows: [index],
          isExpanded: expandedGroups[key],
        };
      } else {
        groups[key].quantity += row.quantity;
        groups[key].kg += row.kg;
        groups[key].co2 += row.co2;
        groups[key].ubp += row.ubp;
        groups[key].kwh += row.kwh;
        groups[key].rows.push(index);
      }
    });

    return Object.values(groups);
  }, [data, isGrouped, expandedGroups]);

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
    setSelectedRows(isChecked ? data.map((_, index) => index) : []);
  };

  const handleBulkUpdate = (material: MaterialOption) => {
    if (selectedRows.length > 0 && onUpdateMaterial) {
      onUpdateMaterial(selectedRows, material);
      setSelectedRows([]); // Clear selection after update
      setBulkMaterial(""); // Reset bulk material dropdown
    }
  };

  // Get available materials from the first row (they should all be the same)
  const availableMaterials = data[0]?.availableMaterials || [];

  const handleExportCSV = () => {
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

    // Determine which rows to export
    const rowsToExport =
      selectedRows.length > 0 ? selectedRows : data.map((_, index) => index);

    // Create CSV content
    const csvContent = [
      // Headers: Original headers + new result columns
      [
        ...originalHeaders,
        "Matched Material",
        "CO2 (kg CO2 eq)",
        "UBP (pts)",
        "Energy (kWh)",
      ]
        .map(escapeCSV)
        .join(","),

      // Rows: Combine original data with results
      ...rowsToExport.map((index) => {
        const originalData = originalHeaders.map((header) => {
          const value = originalRowData[index][header] || "";
          return escapeCSV(value);
        });

        const resultData = [
          data[index].matchedMaterial,
          data[index].co2.toFixed(2),
          data[index].ubp.toFixed(2),
          data[index].kwh.toFixed(2),
        ].map(escapeCSV);

        return [...originalData, ...resultData].join(",");
      }),
    ].join("\n");

    // Create and trigger download with BOM for Excel compatibility
    const BOM = "\uFEFF"; // Add BOM for proper UTF-8 encoding in Excel
    const blob = new Blob([BOM + csvContent], {
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
  };

  // Calculate totals
  const totals = {
    totalMass: data.reduce((sum, row) => sum + row.kg, 0),
    totalCO2: data.reduce((sum, row) => sum + row.co2, 0),
    totalUBP: data.reduce((sum, row) => sum + row.ubp, 0),
    totalEnergy: data.reduce((sum, row) => sum + row.kwh, 0),
    itemCount: data.length,
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

  return (
    <div className="space-y-6">
      <TotalsSummary data={totals} />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsGrouped(!isGrouped)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isGrouped ? "Gruppierung aufheben" : "Ähnliche Zeilen gruppieren"}
          </button>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedRows.length === data.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              {selectedRows.length} Zeilen ausgewählt
            </span>
          </div>

          {selectedRows.length > 0 && (
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

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.length === data.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </th>
              {isGrouped && <th className="w-8 px-2 py-3"></th>}
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Element
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Material
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Zugeordnetes Material
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                {data[0]?.unit === "m3" ? "Volumen (m³)" : "Masse (kg)"}
              </th>
              {data[0]?.unit === "m3" && (
                <>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Dichte (kg/m³)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Masse (kg)
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                CO₂ (kg CO₂ eq)
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                UBP (Pkt)
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Energie (kWh)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isGrouped && groupedData
              ? groupedData.map((group) => {
                  const key = `${group.element}|${group.material}`;
                  return (
                    <Fragment key={key}>
                      <tr className="hover:bg-gray-50">
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
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => handleGroupToggle(key)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {expandedGroups[key] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-2">{group.element}</td>
                        <td className="px-4 py-2">{group.material}</td>
                        <td className="px-4 py-2">
                          <MaterialDropdown
                            materials={group.availableMaterials}
                            selectedMaterial={group.matchedMaterial}
                            onSelect={(material) =>
                              onUpdateMaterial?.(group.rows, material)
                            }
                            showDensity={group.unit === "m3"}
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {group.quantity.toFixed(2)}
                        </td>
                        {group.unit === "m3" && (
                          <>
                            <td className="px-4 py-2 text-right">
                              {group.density?.toFixed(2) || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              {group.kg.toFixed(2)}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2 text-right font-medium">
                          {group.co2.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {group.ubp.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {group.kwh.toFixed(2)}
                        </td>
                      </tr>
                      {expandedGroups[key] &&
                        group.rows.map((index) => (
                          <tr key={`${key}-${index}`} className="bg-gray-50">
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(index)}
                                onChange={(e) =>
                                  handleRowSelect(index, e.target.checked)
                                }
                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                              />
                            </td>
                            <td className="px-2 py-2"></td>
                            <td className="px-4 py-2">{data[index].element}</td>
                            <td className="px-4 py-2">
                              {data[index].material}
                            </td>
                            <td className="px-4 py-2">
                              <MaterialDropdown
                                materials={data[index].availableMaterials}
                                selectedMaterial={data[index].matchedMaterial}
                                onSelect={(material) =>
                                  onUpdateMaterial?.([index], material)
                                }
                                showDensity={data[index].unit === "m3"}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              {data[index].quantity.toFixed(2)}
                            </td>
                            {data[index].unit === "m3" && (
                              <>
                                <td className="px-4 py-2 text-right">
                                  {data[index].density?.toFixed(2) || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {data[index].kg.toFixed(2)}
                                </td>
                              </>
                            )}
                            <td className="px-4 py-2 text-right">
                              {data[index].co2.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {data[index].ubp.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {data[index].kwh.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })
              : // Original row rendering
                data.map((row, index) => (
                  <tr
                    key={index}
                    className={`${
                      selectedRows.includes(index) ? "bg-blue-50" : ""
                    } hover:bg-gray-50`}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(index)}
                        onChange={(e) =>
                          handleRowSelect(index, e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600"
                      />
                    </td>
                    <td className="px-4 py-2">{row.element}</td>
                    <td className="px-4 py-2">{row.material}</td>
                    <td className="px-4 py-2">
                      <MaterialDropdown
                        materials={row.availableMaterials}
                        selectedMaterial={row.matchedMaterial}
                        onSelect={(material) =>
                          onUpdateMaterial?.([index], material)
                        }
                        showDensity={row.unit === "m3"}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {row.quantity.toFixed(2)}
                    </td>
                    {row.unit === "m3" && (
                      <>
                        <td className="px-4 py-2 text-right">
                          {row.density?.toFixed(2) || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {row.kg.toFixed(2)}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2 text-right">
                      {row.co2.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {row.ubp.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {row.kwh.toFixed(2)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
