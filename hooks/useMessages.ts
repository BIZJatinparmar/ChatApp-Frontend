import { useQuery } from "@tanstack/react-query";
import { listMessages } from "../api/messages";

export function useMessages(conversationId: string | null) {
    return useQuery({
        queryKey: ["messages", conversationId],
        enabled: Boolean(conversationId),
        queryFn: ({ signal }) => {
            if (!conversationId) {
                throw new Error("conversationId is required");
            }
            return listMessages(conversationId, signal);
        },
    });
}