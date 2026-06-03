import type { Message } from "../api/types";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";

type MessageProps = {
  message: Message;
};

export const MessageRow = ({ message }: MessageProps) => {
  return (
    <div
      key={message.id}
      className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
          message.role === "user"
            ? "bg-[#f0eded] text-[#1b1b1b]"
            : "bg-transparent text-[#1b1b1b]"
        }`}
      >
        {message.role === "assistant" && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-[#4648d4] text-white flex items-center justify-center text-xs font-bold">
              C
            </div>
            <span className="font-medium">Assistant</span>
          </div>
        )}

        {!message.content && (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-[#c7c4d7] animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[#c7c4d7] animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[#c7c4d7] animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}

        <div className="prose prose-sm max-w-none dark:prose-invert text-black">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
