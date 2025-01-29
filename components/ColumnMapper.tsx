"use client";

import { useState, useEffect } from "react";

interface ColumnMapperProps {
  headers: string[];
  onMapColumns: (mapping: ColumnMap) => void;
  columnMap?: ColumnMap;
  initialUnit?: "kg" | "m3" | "m2";
  onColumnSelect?: (type: keyof ColumnMap, value: string) => void;
}

interface ColumnMap {
  element: string;
  material: string;
  quantity: string;
}

export default function ColumnMapper({
  headers,
  onMapColumns,
  columnMap,
  initialUnit = "m3",
  onColumnSelect,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMap>({
    element: columnMap?.element || "",
    material: columnMap?.material || "",
    quantity: columnMap?.quantity || "",
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!mapping.element || !mapping.material || !mapping.quantity) {
      setError("Bitte wählen Sie alle erforderlichen Spalten aus.");
      return;
    }
    setError(null);
    onMapColumns(mapping);
  };

  // Log column selection changes
  const handleColumnSelect = (type: keyof ColumnMap, value: string) => {
    console.log(`Column selected for ${type}:`, value);
    setMapping({ ...mapping, [type]: value });
    if (onColumnSelect) {
      onColumnSelect(type, value);
    }
  };

  // Auto-detect columns based on common names
  useEffect(() => {
    const autoDetectColumns = () => {
      const newMapping = { ...mapping };
      let updated = false;

      headers.forEach((header) => {
        const headerLower = header.toLowerCase();

        // Element detection
        if (
          !newMapping.element &&
          (headerLower.includes("element") ||
            headerLower.includes("bauteil") ||
            headerLower.includes("component"))
        ) {
          newMapping.element = header;
          updated = true;
          console.log("Auto-detected element column:", header);
        }

        // Material detection
        if (
          !newMapping.material &&
          (headerLower.includes("material") ||
            headerLower.includes("type") ||
            headerLower.includes("art"))
        ) {
          newMapping.material = header;
          updated = true;
          console.log("Auto-detected material column:", header);
        }

        // Quantity detection
        if (
          !newMapping.quantity &&
          (headerLower.includes("menge") ||
            headerLower.includes("quantity") ||
            headerLower.includes("amount") ||
            headerLower.includes("value"))
        ) {
          newMapping.quantity = header;
          updated = true;
          console.log("Auto-detected quantity column:", header);
        }
      });

      if (updated) {
        setMapping(newMapping);
      }
    };

    if (!columnMap) {
      autoDetectColumns();
    }
  }, [headers, columnMap]);

  return (
    <div className="bg-white dark:bg-[#1a1b26] rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-[#a9b1d6]">
        Spalten zuordnen
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-[#a9b1d6] flex items-center gap-2">
              Bauteil
              <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-blue-500 dark:border-blue-600 text-blue-500 dark:text-blue-600 text-xs font-medium">
                1
              </span>
            </span>
            <select
              value={mapping.element}
              onChange={(e) => handleColumnSelect("element", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-[#24283b] bg-white dark:bg-[#1a1b26] px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-[#7aa2f7] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#7aa2f7] text-gray-900 dark:text-[#a9b1d6]"
            >
              <option value="">Spalte auswählen...</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-[#565f89]">
              Die Spalte, die den Namen oder die Bezeichnung des Bauteils
              enthält
            </p>
          </label>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-[#a9b1d6] flex items-center gap-2">
              Material
              <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-green-500 dark:border-green-600 text-green-500 dark:text-green-600 text-xs font-medium">
                2
              </span>
            </span>
            <select
              value={mapping.material}
              onChange={(e) => handleColumnSelect("material", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-[#24283b] bg-white dark:bg-[#1a1b26] px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-[#7aa2f7] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#7aa2f7] text-gray-900 dark:text-[#a9b1d6]"
            >
              <option value="">Spalte auswählen...</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-[#565f89]">
              Die Spalte, die die Materialbezeichnung enthält
            </p>
          </label>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-[#a9b1d6] flex items-center gap-2">
              Menge
              <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-purple-500 dark:border-purple-600 text-purple-500 dark:text-purple-600 text-xs font-medium">
                3
              </span>
            </span>
            <select
              value={mapping.quantity}
              onChange={(e) => handleColumnSelect("quantity", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-[#24283b] bg-white dark:bg-[#1a1b26] px-3 py-2 text-sm focus:border-blue-500 dark:focus:border-[#7aa2f7] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#7aa2f7] text-gray-900 dark:text-[#a9b1d6]"
            >
              <option value="">Spalte auswählen...</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-[#565f89]">
              Die Spalte, die die Mengenwerte enthält
            </p>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 dark:bg-[#7aa2f7] text-white rounded-md hover:bg-blue-700 dark:hover:bg-[#7aa2f7]/90 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#7aa2f7] focus:ring-offset-2"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
