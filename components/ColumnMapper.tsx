"use client";

import { useState } from "react";
import { Scale, Box } from "lucide-react";

interface ColumnMapperProps {
  columns: string[];
  onMap: (mapping: Record<string, string>, unit: "kg" | "m3") => void;
  csvPreview?: string[][];
  onCancel?: () => void;
  initialMapping?: Record<string, string>;
  initialUnit?: "kg" | "m3";
}

export default function ColumnMapper({
  columns,
  onMap,
  csvPreview = [],
  onCancel,
  initialMapping,
  initialUnit = "kg",
}: ColumnMapperProps) {
  // Store column index along with name in the mapping
  const [mapping, setMapping] = useState<Record<string, string>>(
    initialMapping || {
      element: "",
      material: "",
      quantity: "",
    }
  );

  const [unit, setUnit] = useState<"kg" | "m3">(initialUnit);

  // Create unique identifiers for each column (including duplicates)
  const columnIdentifiers = columns.map((col, index) => `${col}:${index}`);

  // Create display names for columns with duplicates
  const getDisplayName = (col: string, index: number) => {
    const count = columns.filter((c) => c === col).length;
    return count > 1 ? `${col} (${index + 1})` : col;
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Preview Table */}
      {csvPreview.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="font-medium text-gray-700 mb-2">Data Preview</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((header, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {getDisplayName(header, i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {csvPreview.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((col, colIndex) => {
                    const currentIdentifier = `${col}:${colIndex}`;
                    return (
                      <td
                        key={colIndex}
                        className={`px-3 py-2 text-sm ${
                          mapping.element === currentIdentifier ||
                          mapping.material === currentIdentifier ||
                          mapping.quantity === currentIdentifier
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        {row[colIndex]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Convert identifiers back to column names before sending
          const cleanMapping = Object.fromEntries(
            Object.entries(mapping).map(([key, value]) => [
              key,
              value.split(":")[0], // Extract just the column name
            ])
          );
          onMap(cleanMapping, unit);
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-3 gap-4">
          {Object.keys(mapping).map((field) => (
            <div key={field} className="flex flex-col">
              <label htmlFor={field} className="mb-2 font-medium">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <select
                id={field}
                value={mapping[field]}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, [field]: e.target.value }))
                }
                className="p-2 border rounded"
                required
              >
                <option value="">Select {field} column</option>
                {columns.map((column, index) => (
                  <option
                    key={`${field}-${column}-${index}`}
                    value={`${column}:${index}`}
                  >
                    {getDisplayName(column, index)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block mb-4 font-medium text-gray-700">
            Select Quantity Unit
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUnit("kg")}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                unit === "kg"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Scale
                className={unit === "kg" ? "text-blue-500" : "text-gray-400"}
              />
              <div className="text-left">
                <div className="font-medium">Mass</div>
                <div className="text-sm text-gray-500">Kilograms (kg)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUnit("m3")}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                unit === "m3"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Box
                className={unit === "m3" ? "text-blue-500" : "text-gray-400"}
              />
              <div className="text-left">
                <div className="font-medium">Volume</div>
                <div className="text-sm text-gray-500">Cubic Meters (m³)</div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {initialMapping ? "Update Mapping" : "Map Columns and Process Data"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
