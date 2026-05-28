import { InputBox } from "../components/InputBox";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router";
import { useMessages } from "../hooks/useMessages";
import { useSendMessage } from "../hooks/useSendMessage";
import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

export function Chat() {
  const { threadId } = useParams();
  const { state } = useLocation();

  if (threadId) {
    return <ChatList threadId={threadId} state={state} />;
  }
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#4648d4]" size={32} />
    </div>
  );
}

type ChatListProps = {
  threadId: string;
  state: any;
};
const ChatList = ({ threadId, state }: ChatListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: thread, isLoading } = useMessages(threadId, {
    enabled: !!threadId,
  });

  const { sendMessage, isStreaming, streamedText } = useSendMessage(threadId);

  const isFirstTime = useRef(true);
  // When thread is first loaded and only has user's first message, generate response
  useEffect(() => {
    if (state && state.message && state.new && isFirstTime.current) {
      isFirstTime.current = false;
      sendMessage(state.message);
    }
  }, [state]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages, isStreaming]);

  if (isLoading || !thread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4648d4]" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 w-full flex flex-col items-center">
        <div className="w-full max-w-[800px] flex flex-col pb-8 pt-8 gap-6">
          {thread.messages.map((message) => (
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
          ))}

          {isStreaming && (
            <div key={streamedText} className={`flex w-full  "justify-start"`}>
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${"bg-transparent text-[#1b1b1b]"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-[#4648d4] text-white flex items-center justify-center text-xs font-bold">
                    C
                  </div>
                  <span className="font-medium">Assistant</span>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed">
                  {!streamedText && (
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
                      {streamedText}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="w-full flex-shrink-0 flex flex-col items-center px-4 sm:px-6 pb-6 pt-2 bg-gradient-to-t from-[#fcf9f8] via-[#fcf9f8] to-transparent">
        <div className="w-full max-w-[800px]">
          <InputBox
            onSubmit={(text, modelId) => sendMessage(text, modelId)}
            isPending={isStreaming}
            placeholder="Reply to assistant..."
          />
        </div>
      </div>
    </div>
  );
};
