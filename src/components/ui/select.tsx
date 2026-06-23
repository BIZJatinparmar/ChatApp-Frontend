import { ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type SelectOption<T> = {
  readonly label: string;
  readonly value: T;
};
type SelectBoxProps<T> = {
  onModelChange: (model: T) => void;
  selectedValue: T;
  readonly options: readonly SelectOption<T>[];
};
export function SelectBox<T extends object | string>({
  onModelChange,
  selectedValue,
  options,
}: SelectBoxProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative " ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#c7c4d7] bg-[#f6f3f2] text-[#464554] hover:bg-[#f0eded] transition-colors text-sm font-medium group/model"
      >
        <span className="text-xs">
          {options.find((o) => o.value === selectedValue)?.label}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""} group-hover/model:text-[#4648d4]`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mt-2 w-56 bg-white border border-[#e2e2e1] rounded-xl shadow-lg z-50 max-h-[300px] overflow-auto">
          <div className="p-2 flex flex-col gap-1">
            {options.map((model) => (
              <button
                key={model.value.toString()}
                onClick={() => {
                  onModelChange(model.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[14px] rounded-lg flex items-center justify-between transition-colors ${
                  selectedValue.toString() === model.value.toString()
                    ? "bg-[#f6f3f2] text-[#1b1b1b] font-medium"
                    : "text-[#464554] hover:bg-[#f0eded] hover:text-[#1b1b1b]"
                }`}
              >
                {model.label}
                {selectedValue.toString() === model.value.toString() && (
                  <Check size={16} className="text-[#4648d4]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
