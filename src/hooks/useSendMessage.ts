import { useCallback, useEffect, useRef, useState } from "react";
import type { ListMessagesResponse, Message } from "../api/types";
import { useQueryClient } from "@tanstack/react-query";
import { readNdjsonStream } from "../api/streamChat";
import { API_BASE_URL, ApiError } from "../api/client";

type BudgetExceededDetail = {
  code: "TOKEN_BUDGET_EXCEEDED";
  message: string;
  total_tokens: number;
  token_budget: number;
};

function isBudgetExceededDetail(value: unknown): value is BudgetExceededDetail {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    (value as { code?: unknown }).code === "TOKEN_BUDGET_EXCEEDED"
  );
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();

  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const abortRef = useRef<AbortController | null>(null);

  const [displayedText, setDisplayedText] = useState("");
  const displayIndexRef = useRef(0);

  const streamFinishedRef = useRef(false);

  useEffect(() => {
    let frame: number;

    const animate = () => {
      if (displayIndexRef.current < streamedText.length) {
        displayIndexRef.current += 4;
        setDisplayedText(streamedText.slice(0, displayIndexRef.current));

        frame = requestAnimationFrame(animate);
      }
    };

    if (isStreaming) {
      frame = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(frame);
  }, [streamedText, isStreaming]);

  if (
    streamFinishedRef.current &&
    displayedText === streamedText &&
    isStreaming
  ) {
    setIsStreaming(false);
    streamFinishedRef.current = false;
    setTimeout(() => {
      setStreamedText("");
      displayIndexRef.current = 0;
      setDisplayedText("");
    }, 0);
  }

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
        const res = await fetch(`${API_BASE_URL}/chat/stream`, {
          method: "POST",
          credentials: "include",
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
          const contentType = res.headers.get("content-type") ?? "";
          const body = contentType.includes("application/json")
            ? await res.json().catch(() => null)
            : await res.text();
          const detail =
            typeof body === "object" && body && "detail" in body
              ? (body as { detail: unknown }).detail
              : null;
          const message = isBudgetExceededDetail(detail)
            ? detail.message
            : `Request failed: ${res.status}`;

          throw new ApiError(message, res.status, body);
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

        streamFinishedRef.current = true;

        return fullText;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        qc.setQueryData<ListMessagesResponse>(
          ["messages", conversationId],
          (old = { messages: [] }) => ({
            messages: old.messages.filter(
              (messageItem) => messageItem.id !== userMessage.id,
            ),
          }),
        );
        setError(err);
        setStreamedText("");

        throw err;
      } finally {
        if (abortRef.current === ac) {
          abortRef.current = null;
        }

        streamFinishedRef.current = true;
      }
    },
    [conversationId, qc],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamedText("");
    streamFinishedRef.current = true;
  }, []);

  return {
    sendMessage,
    streamedText: displayedText,
    isStreaming,
    error,
    cancel,
  };
}
