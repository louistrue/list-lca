"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialOption {
  id: string;
  name: string;
  co2: number;
  ubp: number;
  kwh: number;
  density: number;
}

interface MaterialDropdownProps {
  materials: MaterialOption[];
  selectedMaterial?: string;
  onSelect: (material: MaterialOption) => void;
  placeholder?: string;
  showDensity?: boolean;
}

export default function MaterialDropdown({
  materials = [],
  selectedMaterial,
  onSelect,
  placeholder = "Material auswählen...",
  showDensity = false,
}: MaterialDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
      // Focus search input when opening
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleSelect = (material: MaterialOption) => {
    console.log('MaterialDropdown handleSelect:', {
      material,
      selectedMaterial,
      materials
    });
    
    setIsOpen(false);
    setSearchTerm("");
    onSelect({
      id: material.id,
      name: material.name,
      co2: material.co2,
      ubp: material.ubp,
      kwh: material.kwh,
      density: material.density,
    });
  };

  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return materials;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return materials.filter((material) =>
      material.name.toLowerCase().includes(lowerSearchTerm)
    );
  }, [materials, searchTerm]);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-[#a9b1d6] bg-white dark:bg-[#1a1b26] border border-gray-300 dark:border-[#24283b] rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-[#292e42] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="truncate">
          {selectedMaterial || "Material auswählen..."}
          {showDensity && materials.find(m => m.name === selectedMaterial)?.density !== undefined && (
            <span className="ml-2 text-gray-500 dark:text-[#565f89]">
              ({materials.find(m => m.name === selectedMaterial)?.density} kg/m³)
            </span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 dark:text-[#565f89]" />
      </button>

      {isOpen && (
        <div
          ref={listboxRef}
          className="absolute z-50 mt-1 w-[400px] bg-white dark:bg-[#1a1b26] shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
          style={{ left: '0', top: '100%' }}
        >
          <div className="sticky top-0 z-10 bg-white dark:bg-[#1a1b26] px-2 py-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#565f89]" />
              <input
                type="text"
                ref={inputRef}
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 dark:text-[#a9b1d6] ring-1 ring-inset ring-gray-300 dark:ring-[#24283b] placeholder:text-gray-400 dark:placeholder:text-[#565f89] focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-[#7aa2f7] sm:text-sm sm:leading-6 bg-white dark:bg-[#1a1b26]"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="py-1">
            {filteredMaterials.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#565f89] text-center">
                Keine Materialien gefunden
              </div>
            ) : (
              filteredMaterials.map((material) => (
                <button
                  key={material.id}
                  className={cn(
                    "flex items-center px-3 py-2 w-full text-sm text-left hover:bg-gray-100 dark:hover:bg-[#292e42]",
                    material.name === selectedMaterial &&
                      "bg-blue-50 dark:bg-[#24283b] text-blue-600 dark:text-[#7aa2f7]"
                  )}
                  onClick={() => handleSelect(material)}
                >
                  <span className="flex-1 truncate">
                    {material.name}
                    {material.density !== undefined && (
                      <span className="ml-2 text-gray-500 dark:text-[#565f89]">
                        ({material.density} kg/m³)
                      </span>
                    )}
                  </span>
                  {material.name === selectedMaterial && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-[#7aa2f7]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
