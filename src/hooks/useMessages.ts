import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listMessages } from "../api/messages";
import { type ListMessagesResponse } from "../api/types";

export function useMessages(
  conversationId: string | null,
  options?: Partial<UseQueryOptions<ListMessagesResponse>>,
) {
  return useQuery<ListMessagesResponse>({
    ...options,
    queryKey: ["messages", conversationId],
    queryFn: ({ signal }) => {
      if (!conversationId) {
        throw new Error("conversationId is required");
      }
      return listMessages(conversationId, signal);
    },
  });
}
