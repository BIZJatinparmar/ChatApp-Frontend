import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
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

type StreamState = {
  streamedText: string;
  displayedText: string;
  isStreaming: boolean;
  error: unknown;
  optimisticMessages: Message[];
};

type State = Record<string, StreamState>;

type Action =
  | { type: "START"; conversationId: string; userMessage: Message }
  | { type: "APPEND_STREAM"; conversationId: string; text: string }
  | { type: "ADVANCE_DISPLAY"; conversationId: string; text: string }
  | { type: "FINISH"; conversationId: string }
  | { type: "ERROR"; conversationId: string; error: unknown }
  | { type: "RESET"; conversationId: string };

const emptyStreamState: StreamState = {
  streamedText: "",
  displayedText: "",
  isStreaming: false,
  error: null,
  optimisticMessages: [],
};

const emptyByConversation: State = {};

function getStreamState(state: State, conversationId: string): StreamState {
  return state[conversationId] ?? emptyStreamState;
}

function reducer(state: State, action: Action): State {
  const current = getStreamState(state, action.conversationId);

  switch (action.type) {
    case "START":
      console.log("START", action);
      return {
        ...state,
        [action.conversationId]: {
          ...current,
          isStreaming: true,
          error: null,
          streamedText: "",
          displayedText: "",
          optimisticMessages: [action.userMessage],
        },
      };

    case "APPEND_STREAM":
      console.log("APPEND_STREAM", action.conversationId);
      return {
        ...state,
        [action.conversationId]: {
          ...current,
          streamedText: current.streamedText + action.text,
        },
      };

    case "ADVANCE_DISPLAY":
      console.log("ADVANCE_DISPLAY", action.conversationId);
      return {
        ...state,
        [action.conversationId]: {
          ...current,
          displayedText: action.text,
        },
      };

    case "FINISH":
      console.log("FINISH", action.conversationId);
      return {
        ...state,
        [action.conversationId]: {
          ...current,
          isStreaming: false,
        },
      };

    case "ERROR":
      console.log("ERROR", action.conversationId);
      return {
        ...state,
        [action.conversationId]: {
          ...current,
          error: action.error,
          isStreaming: false,
          optimisticMessages: [],
        },
      };

    case "RESET": {
      console.log("RESET", action.conversationId);
      const next = { ...state };
      delete next[action.conversationId];
      return next;
    }

    default:
      return state;
  }
}

type ChatStreamContextValue = {
  streams: State;
  sendMessage: (
    conversationId: string,
    message: string,
    modelId?: string,
  ) => Promise<string | undefined>;
  cancel: (conversationId: string) => void;
};

const ChatStreamContext = createContext<ChatStreamContextValue | null>(null);

export function ChatStreamProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [streams, dispatch] = useReducer(reducer, emptyByConversation);

  const abortRefs = useRef<Record<string, AbortController | null>>({});
  const displayIndexRefs = useRef<Record<string, number>>({});
  const streamFinishedRefs = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const frameIds: number[] = [];
    const timeoutIds: number[] = [];

    console.log("Streams", streams);
    for (const [conversationId, stream] of Object.entries(streams)) {
      if (!stream.isStreaming) {
        continue;
      }
      console.log(displayIndexRefs.current[conversationId]);
      console.log(streamFinishedRefs.current[conversationId]);
      console.log("STREAM LENGTH", stream.streamedText.length);

      if (streamFinishedRefs.current[conversationId]) {
        if (stream.displayedText === stream.streamedText) {
          dispatch({ type: "FINISH", conversationId });
          streamFinishedRefs.current[conversationId] = false;

          const timeoutId = window.setTimeout(() => {
            dispatch({ type: "RESET", conversationId });
            displayIndexRefs.current[conversationId] = 0;
          }, 0);
          timeoutIds.push(timeoutId);
          continue;
        }
      }

      if (
        (displayIndexRefs.current[conversationId] ?? 0) <
        stream.streamedText.length
      ) {
        console.log("REQUESTING ANIMATION FRAME");
        const frameId = window.requestAnimationFrame(() => {
          const nextIndex = (displayIndexRefs.current[conversationId] ?? 0) + 4;
          displayIndexRefs.current[conversationId] = nextIndex;

          dispatch({
            type: "ADVANCE_DISPLAY",
            conversationId,
            text: stream.streamedText.slice(0, nextIndex),
          });
        });
        frameIds.push(frameId);
      }
    }

    return () => {
      console.log("return useeffect");
      frameIds.forEach((frameId) => window.cancelAnimationFrame(frameId));
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [streams]);

  const sendMessage = useCallback(
    async (conversationId: string, message: string, modelId = "gpt-5-nano") => {
      abortRefs.current[conversationId]?.abort();

      const ac = new AbortController();
      abortRefs.current[conversationId] = ac;

      displayIndexRefs.current[conversationId] = 0;
      streamFinishedRefs.current[conversationId] = false;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        conversationId,
        createdAt: new Date().toISOString(),
        payloadJson: "",
      };

      dispatch({ type: "START", conversationId, userMessage });

      qc.setQueryData<ListMessagesResponse>(
        ["messages", conversationId],
        (old) => ({
          messages: appendMessageIfMissing(old?.messages ?? [], userMessage),
        }),
      );

      try {
        const res = await fetch(`${API_BASE_URL}/chat/stream`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message_id: userMessage.id,
            conversation_id: conversationId,
            user_content: userMessage.content,
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

          dispatch({
            type: "APPEND_STREAM",
            conversationId,
            text: chunk.content,
          });
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
          (old) => ({
            messages: appendMessageIfMissing(
              appendMessageIfMissing(old?.messages ?? [], userMessage),
              assistantMessage,
            ),
          }),
        );

        streamFinishedRefs.current[conversationId] = true;
        return fullText;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        qc.setQueryData<ListMessagesResponse>(
          ["messages", conversationId],
          (old) => ({
            messages: (old?.messages ?? []).filter(
              (m) => m.id !== userMessage.id,
            ),
          }),
        );

        dispatch({ type: "ERROR", conversationId, error: err });
        throw err;
      } finally {
        if (abortRefs.current[conversationId] === ac) {
          abortRefs.current[conversationId] = null;
        }

        streamFinishedRefs.current[conversationId] = true;
      }
    },
    [qc],
  );

  const cancel = useCallback((conversationId: string) => {
    abortRefs.current[conversationId]?.abort();
    abortRefs.current[conversationId] = null;

    streamFinishedRefs.current[conversationId] = true;
    dispatch({ type: "RESET", conversationId });
  }, []);

  const value = useMemo(
    () => ({
      streams,
      sendMessage,
      cancel,
    }),
    [cancel, sendMessage, streams],
  );

  return (
    <ChatStreamContext.Provider value={value}>
      {children}
    </ChatStreamContext.Provider>
  );
}

function useChatStreamContext() {
  const context = useContext(ChatStreamContext);

  if (!context) {
    throw new Error("useSendMessage must be used within ChatStreamProvider");
  }

  return context;
}

function appendMessageIfMissing(messages: Message[], message: Message) {
  if (messages.some((existing) => existing.id === message.id)) {
    return messages;
  }

  return [...messages, message];
}

export function useChatStreams() {
  return useChatStreamContext();
}

export function useSendMessage(conversationId: string) {
  const { streams, sendMessage, cancel } = useChatStreamContext();
  const stream = getStreamState(streams, conversationId);

  return {
    sendMessage: (message: string, modelId?: string) =>
      sendMessage(conversationId, message, modelId),
    streamedText: stream.displayedText,
    isStreaming: stream.isStreaming,
    error: stream.error,
    optimisticMessages: stream.optimisticMessages,
    cancel: () => cancel(conversationId),
  };
}
