import { ArrowUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { ModelPicker } from "./ModalPicker";
import { MODELS } from "../../model-list";
import { SelectBox } from "./ui/select";
import { CHAT_MODES } from "../constants";
interface InputBoxProps {
  onSubmit: (
    text: string,
    modelId: string,
    chatMode: (typeof CHAT_MODES)[number]["value"],
  ) => void;
  isPending?: boolean;
  placeholder?: string;
}

export function InputBox({
  onSubmit,
  isPending,
  placeholder = "Message Ai Chat...",
}: InputBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedMode, setSelectedMode] =
    useState<(typeof CHAT_MODES)[number]["value"]>("auto");

  const handleSubmit = () => {
    if (text.trim() && !isPending) {
      onSubmit(text, selectedModel.id, selectedMode);
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={`w-full bg-white border rounded-xl flex flex-col p-2 sm:p-3 transition-colors relative group ${
        isFocused
          ? "border-[#c0c1ff] shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          : "border-[#c7c4d7] shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
      }`}
    >
      <textarea
        className="w-full bg-transparent border-none resize-none focus:ring-0 p-3 pt-1 text-[18px] text-[#1b1b1b] placeholder:text-[#767586] min-h-[100px] outline-none disabled:opacity-50"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        disabled={isPending}
      />
      <div className="flex justify-between items-center px-2 pb-1 mt-2">
        <SelectBox
          options={CHAT_MODES}
          selectedValue={selectedMode}
          onModelChange={(mode) => setSelectedMode(mode)}
        />
        <div className="flex flex-row gap-2 items-center">
          <div className="px-3 pt-2 pb-1 relative z-20">
            <ModelPicker
              onModelChange={setSelectedModel}
              selectedModel={selectedModel}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isPending}
            className={`border p-2 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 ${
              text.trim()
                ? "bg-[#4648d4] text-white border-[#4648d4] hover:bg-[#6063ee]"
                : "bg-[#f0eded] border-[#c7c4d7] text-[#1b1b1b]"
            }`}
          >
            {isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ArrowUp size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
