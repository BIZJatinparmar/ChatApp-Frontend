import { InputBox } from "../components/InputBox";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useMessages } from "../hooks/useMessages";
import { useSendMessage } from "../hooks/useSendMessage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBudgetRequest,
  listMyBudgetRequests,
} from "../api/budgetRequests";
import { ApiError } from "../api/client";

import { MessageRow } from "../components/Message";
import type { Message } from "../api/types";

export function Chat() {
  const { threadId } = useParams();

  if (threadId) {
    return <ChatList threadId={threadId} />;
  }
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#4648d4]" size={32} />
    </div>
  );
}

type ChatListProps = {
  threadId: string;
};
const ChatList = ({ threadId }: ChatListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: thread, isLoading } = useMessages(threadId, {
    enabled: !!threadId,
  });

  const {
    sendMessage,
    isStreaming,
    streamedText,
    citations,
    error,
    optimisticMessages,
  } = useSendMessage(threadId);

  const budgetRequestsQuery = useQuery({
    queryKey: ["my-budget-requests"],
    queryFn: ({ signal }) => listMyBudgetRequests(signal),
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedText, citations, thread?.messages, isStreaming]);

  if (isLoading || !thread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4648d4]" size={32} />
      </div>
    );
  }

  const displayedMessages = mergeMessages(thread.messages, optimisticMessages);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 w-full flex flex-col items-center">
        <div className="w-full max-w-200 flex flex-col pb-8 pt-8 gap-6">
          {displayedMessages
            .filter((message, index) => {
              if (
                index === displayedMessages.length - 1 &&
                isStreaming &&
                message.role === "assistant"
              ) {
                return false;
              }
              return true;
            })
            .map((message) => {
              return <MessageRow key={message.id} message={message} />;
            })}

          {isStreaming && (
            <MessageRow
              key="streaming-assistant"
              message={{
                id: "streaming-assistant",
                conversationId: threadId,
                role: "assistant",
                content: streamedText,
                payloadJson: {
                  citations,
                  citation_count: citations.length,
                },
                createdAt: new Date().toISOString(),
              }}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="w-full shrink-0 flex flex-col items-center px-4 sm:px-6 pb-6 pt-2 bg-linear-to-t from-[#fcf9f8] via-[#fcf9f8] to-transparent">
        <div className="w-full max-w-200">
          {isBudgetExceededError(error) && (
            <BudgetRequestPanel
              hasPendingRequest={(budgetRequestsQuery.data ?? []).some(
                (request) => request.status === "pending",
              )}
              onSubmitted={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["my-budget-requests"],
                });
              }}
            />
          )}
          <InputBox
            onSubmit={(text, modelId, chatMode) =>
              void sendMessage(text, modelId, chatMode).catch(() => undefined)
            }
            isPending={isStreaming || isBudgetExceededError(error)}
            placeholder="Reply to assistant..."
          />
        </div>
      </div>
    </div>
  );
};

function mergeMessages(messages: Message[], optimisticMessages: Message[]) {
  const messageIds = new Set(messages.map((message) => message.id));
  const missingOptimisticMessages = optimisticMessages.filter(
    (message) => !messageIds.has(message.id),
  );

  return [...messages, ...missingOptimisticMessages];
}

function isBudgetExceededError(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 403) {
    return false;
  }

  const detail =
    typeof error.body === "object" && error.body && "detail" in error.body
      ? (error.body as { detail?: unknown }).detail
      : null;

  return (
    typeof detail === "object" &&
    detail !== null &&
    "code" in detail &&
    (detail as { code?: unknown }).code === "TOKEN_BUDGET_EXCEEDED"
  );
}

function BudgetRequestPanel({
  hasPendingRequest,
  onSubmitted,
}: {
  hasPendingRequest: boolean;
  onSubmitted: () => void;
}) {
  const [requestedTokens, setRequestedTokens] = useState("100000");
  const [note, setNote] = useState("");

  const requestMutation = useMutation({
    mutationFn: createBudgetRequest,
    onSuccess: onSubmitted,
  });

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestMutation.mutate({
      requested_tokens: Number(requestedTokens) || 0,
      note: note.trim() || null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
    >
      <div className="font-semibold">Token budget reached</div>
      <div className="mt-1 text-red-800">
        Request additional budget from your admin. Refresh the app after
        approval to re-check access.
      </div>

      {hasPendingRequest && (
        <div className="mt-2 rounded-md bg-white/70 px-3 py-2 text-red-800">
          You already have a pending budget request.
        </div>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
        <input
          value={requestedTokens}
          onChange={(event) => setRequestedTokens(event.target.value)}
          min={1}
          type="number"
          disabled={hasPendingRequest || requestMutation.isPending}
          className="h-10 rounded-md border border-red-200 bg-white px-3 text-sm text-[#1b1b1b] outline-none disabled:bg-[#f7f4f3]"
        />
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          disabled={hasPendingRequest || requestMutation.isPending}
          placeholder="Optional note"
          className="h-10 rounded-md border border-red-200 bg-white px-3 text-sm text-[#1b1b1b] outline-none disabled:bg-[#f7f4f3]"
        />
        <button
          type="submit"
          disabled={hasPendingRequest || requestMutation.isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#4648d4] px-4 text-sm font-semibold text-white hover:bg-[#393bb7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={15} />
          {requestMutation.isPending ? "Sending..." : "Request"}
        </button>
      </div>

      {requestMutation.error && (
        <div className="mt-2 text-sm font-medium text-red-700">
          {requestMutation.error instanceof Error
            ? requestMutation.error.message
            : "Request failed."}
        </div>
      )}
      {requestMutation.isSuccess && (
        <div className="mt-2 text-sm font-medium text-red-800">
          Request sent to admin.
        </div>
      )}
    </form>
  );
}
