import { ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { MODELS } from "../../model-list";

type ModelPickerProps = {
  onModelChange: (model: (typeof MODELS)[number]) => void;
  selectedModel: (typeof MODELS)[number];
};
export function ModelPicker({
  onModelChange,
  selectedModel,
}: ModelPickerProps) {
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
        <span className="text-xs">{selectedModel.name}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""} group-hover/model:text-[#4648d4]`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mt-2 w-56 bg-white border border-[#e2e2e1] rounded-xl shadow-lg z-50 max-h-[300px] overflow-auto">
          <div className="p-2 flex flex-col gap-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[14px] rounded-lg flex items-center justify-between transition-colors ${
                  selectedModel.id === model.id
                    ? "bg-[#f6f3f2] text-[#1b1b1b] font-medium"
                    : "text-[#464554] hover:bg-[#f0eded] hover:text-[#1b1b1b]"
                }`}
              >
                {model.name}
                {selectedModel.id === model.id && (
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
