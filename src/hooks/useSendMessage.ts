import { useCallback, useRef, useState } from "react";
import type { ListMessagesResponse, Message } from "../api/types";
import { useQueryClient } from "@tanstack/react-query";
import { readNdjsonStream } from "../api/streamChat";

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();

  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string, modelId = "gpt-5-nano") => {
      // Abort any previous stream
      abortRef.current?.abort();

      const ac = new AbortController();
      abortRef.current = ac;

      setIsStreaming(true);
      setError(null);
      setStreamedText("");

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        conversationId,
        createdAt: new Date().toISOString(),
        payloadJson: "",
      };

      qc.setQueryData<ListMessagesResponse>(
        ["messages", conversationId],
        (old = { messages: [] }) => ({
          messages: [...old.messages, userMessage],
        }),
      );

      try {
        const res = await fetch("http://localhost:8000/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message_id: crypto.randomUUID(),
            conversation_id: conversationId,
            user_content: message,
            model_id: modelId,
          }),
          signal: ac.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        let fullText = "";

        for await (const chunk of readNdjsonStream(res, ac.signal)) {
          fullText += chunk.content;
          setStreamedText(fullText);
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          conversationId,
          role: "assistant",
          content: fullText,
          payloadJson: "",
          createdAt: new Date().toISOString(),
        };

        qc.setQueryData<ListMessagesResponse>(
          ["messages", conversationId],
          (old = { messages: [] }) => ({
            messages: [...old.messages, assistantMessage],
          }),
        );

        setStreamedText("");

        return fullText;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(err);
        setStreamedText("");

        throw err;
      } finally {
        if (abortRef.current === ac) {
          abortRef.current = null;
        }

        setIsStreaming(false);
      }
    },
    [conversationId, qc],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamedText("");
    setIsStreaming(false);
  }, []);

  return {
    sendMessage,
    streamedText,
    isStreaming,
    error,
    cancel,
  };
}
