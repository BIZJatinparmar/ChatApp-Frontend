import { PenLine, Code2, FileText, Lightbulb } from "lucide-react";

const SUGGESTIONS = [
  {
    icon: PenLine,
    title: "Draft Content",
    description: "Write a polite email declining a vendor proposal",
  },
  {
    icon: Code2,
    title: "Code Assistant",
    description: "Help me debug a React useEffect dependency loop",
  },
  {
    icon: FileText,
    title: "Analyze Data",
    description: "Summarize the key findings from this PDF report",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm",
    description: "Generate 10 naming ideas for a new minimalist coffee brand",
  },
];

export function PromptSuggestions({
  onSelect,
}: {
  onSelect?: (text: string) => void;
}) {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-12">
      {SUGGESTIONS.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect?.(suggestion.description)}
          className="bg-white border border-[#e2e2e1] rounded-lg p-4 text-left hover:bg-[#f6f3f2] hover:border-[#c7c4d7] transition-all flex flex-col gap-2 group"
        >
          <div className="flex items-center gap-2 text-[#464554] group-hover:text-[#4648d4] transition-colors">
            <suggestion.icon size={18} />
            <span className="text-[12px] font-semibold tracking-[0.05em] uppercase">
              {suggestion.title}
            </span>
          </div>
          <span className="text-[14px] text-[#1b1b1b]">
            {suggestion.description}
          </span>
        </button>
      ))}
    </div>
  );
}
