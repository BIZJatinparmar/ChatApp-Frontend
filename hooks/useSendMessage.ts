import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Message } from "../api/types";
import { type ChatEvent, streamChat } from "api/streamChat";

export function useSendMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (content: string) => {

            return streamChat({
                body: {
                    message_id: crypto.randomUUID(),
                    user_content: content,
                    conversation_id: conversationId
                },

                onEvent: (ev, id) => {
                    const messageQueryKey = [
                        "messages",
                        conversationId,
                    ]
                    const previous = queryClient.getQueryData<{ messages: Message[] }>(messageQueryKey);
                    const isExisting = previous?.messages.find(m => m.id === id)
                    let newMessages = previous?.messages ?? []
                    if (isExisting) {
                        newMessages = newMessages.map(m => {
                            if (m.id === id) {
                                return {
                                    ...m,
                                    content: m.content + ev
                                }
                            }
                            return m
                        })
                    } else {
                        newMessages = [...newMessages, {
                            id,
                            content: ev,
                            conversationId,
                            createdAt: new Date().toISOString(),
                            payloadJson: "",
                            role: "assistant"
                        }]
                    }
                    queryClient.setQueriesData<{ messages: Message[] }>({ queryKey: messageQueryKey, exact: true }, {
                        messages: newMessages
                    })

                },

            })
        },
        onMutate: async (content: string) => {
            let newConversationId = conversationId ?? crypto.randomUUID()

            await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });

            const previous = queryClient.getQueryData<{ messages: Message[] }>([
                "messages",
                conversationId,
            ]);

            const optimisticUserMessage: Message = {
                id: `${crypto.randomUUID()}`,
                conversationId: newConversationId,
                role: "user",
                content,
                payloadJson: "",
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

            // Also refresh conversations list so updatedAt/title can move to top
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });
}