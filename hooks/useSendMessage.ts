import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "../api/messages";
import type { Message } from "../api/types";

export function useSendMessage(conversationId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (content: string) => {
            if (!conversationId) {
                throw new Error("No conversation selected");
            }
            return sendMessage({ conversationId, content });
        },
        onMutate: async (content: string) => {
            if (!conversationId) return;

            await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });

            const previous = queryClient.getQueryData<{ messages: Message[] }>([
                "messages",
                conversationId,
            ]);

            const optimisticUserMessage: Message = {
                id: `tmp-user-${crypto.randomUUID()}`,
                conversationId,
                role: "user",
                content,
                createdAt: new Date().toISOString(),
            };

            queryClient.setQueryData<{ messages: Message[] }>(
                ["messages", conversationId],
                (old) => ({
                    messages: [...(old?.messages ?? []), optimisticUserMessage],
                }),
            );

            return { previous };
        },
        onError: (_err, _content, ctx) => {
            if (!conversationId) return;

            if (ctx?.previous) {
                queryClient.setQueryData(["messages", conversationId], ctx.previous);
            }
        },
        onSuccess: (data) => {
            if (!conversationId) return;

            queryClient.setQueryData<{ messages: Message[] }>(
                ["messages", conversationId],
                (old) => ({
                    messages: [
                        ...(old?.messages ?? []).filter((m) => !m.id.startsWith("tmp-user-")),
                        data.userMessage,
                        data.assistantMessage,
                    ],
                }),
            );

            // Also refresh conversations list so updatedAt/title can move to top
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });
}