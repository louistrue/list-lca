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
  const [dropdownStyles, setDropdownStyles] = useState<null | {
    top: number;
    left: number;
  }>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

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

  const updatePosition = () => {
    const buttonRect = dropdownRef.current?.getBoundingClientRect();
    if (!buttonRect) return;

    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    // Estimate dropdown height if not yet rendered
    const dropdownHeight =
      listboxRef.current?.getBoundingClientRect().height ?? 400;

    let top = buttonRect.bottom + window.scrollY + 4;

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      top = buttonRect.top + window.scrollY - dropdownHeight - 4;
    } else if (spaceBelow < dropdownHeight) {
      window.scrollBy({
        top: dropdownHeight - spaceBelow + 40,
        behavior: "smooth",
      });
    }

    setDropdownStyles({
      top,
      left: buttonRect.left,
    });
  };

  const handleToggle = () => {
    if (!isOpen) {
      // Calculate position before opening
      updatePosition();
    } else {
      // Reset position when closing
      setDropdownStyles(null);
    }
    setIsOpen(!isOpen);
  };

  // Update position when open
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const handleSelect = (material: MaterialOption) => {
    onSelect(material);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "w-full px-3 py-2 text-left text-sm border rounded-lg text-gray-900 dark:text-[#a9b1d6] bg-white dark:bg-[#1a1b26]",
          "hover:border-gray-400 dark:hover:border-[#414868] focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] dark:focus:ring-[#7aa2f7]",
          "flex items-center justify-between gap-2",
          isOpen
            ? "border-gray-400 dark:border-[#414868]"
            : "border-gray-300 dark:border-[#24283b]"
        )}
      >
        <span className="truncate">{selectedMaterial || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-[#565f89] flex-shrink-0" />
      </button>

      {isOpen && dropdownStyles && (
        <div
          ref={listboxRef}
          role="listbox"
          className="fixed z-50 mt-1 bg-white dark:bg-[#1a1b26] border border-gray-200 dark:border-[#24283b] rounded-lg shadow-lg"
          style={{
            width: "400px",
            left: dropdownStyles.left,
            top: dropdownStyles.top,
          }}
        >
          <div className="p-2 border-b border-gray-200 dark:border-[#24283b]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-[#565f89]" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Materialien durchsuchen..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-[#24283b] rounded-md 
                  focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] dark:focus:ring-[#7aa2f7]
                  bg-white dark:bg-[#1a1b26] text-gray-900 dark:text-[#a9b1d6]"
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-auto">
            {filteredMaterials.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 dark:text-[#565f89] text-center">
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
                      "hover:bg-blue-50 dark:hover:bg-[#292e42] focus:outline-none focus:bg-blue-50 dark:focus:bg-[#292e42]",
                      selectedMaterial === material.name &&
                        "bg-blue-50 dark:bg-[#24283b]",
                      "text-gray-900 dark:text-[#a9b1d6]"
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="font-medium break-words whitespace-normal">
                        {material.name}
                      </div>
                      {showDensity && material.density && (
                        <div className="text-xs text-gray-500 dark:text-[#565f89]">
                          {material.density.toFixed(0)} kg/m³
                        </div>
                      )}
                    </div>
                    {selectedMaterial === material.name && (
                      <Check className="w-4 h-4 text-[#7aa2f7] flex-shrink-0" />
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
