"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialOption {
  id: string;
  name: string;
  co2: number;
  ubp: number;
  kwh: number;
  density?: number;
}

interface MaterialDropdownProps {
  materials: MaterialOption[];
  selectedMaterial: string;
  onSelect: (material: MaterialOption) => void;
  placeholder?: string;
  showDensity?: boolean;
}

export default function MaterialDropdown({
  materials,
  selectedMaterial,
  onSelect,
  placeholder = "Material auswählen...",
  showDensity = false,
}: MaterialDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter materials based on search term
  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (material: MaterialOption) => {
    onSelect(material);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative min-w-[300px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 text-left text-sm border rounded-lg",
          "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
          "flex items-center justify-between gap-2",
          isOpen ? "border-gray-400" : "border-gray-300"
        )}
      >
        <span className="truncate">{selectedMaterial || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>

      {isOpen && (
        <div
          className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{
            width: "max(100%, 400px)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Materialien durchsuchen..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-auto">
            {filteredMaterials.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                No materials found
              </div>
            ) : (
              <div className="py-1">
                {filteredMaterials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => handleSelect(material)}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left flex items-center gap-2",
                      "hover:bg-blue-50 focus:outline-none focus:bg-blue-50",
                      selectedMaterial === material.name && "bg-blue-50"
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="font-medium break-words whitespace-normal">
                        {material.name}
                      </div>
                      {showDensity && material.density && (
                        <div className="text-xs text-gray-500">
                          {material.density.toFixed(0)} kg/m³
                        </div>
                      )}
                    </div>
                    {selectedMaterial === material.name && (
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
