import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createConversation } from "api/conversations";
import { ChatLayout } from "components/ChatLayout";
import { ConversationList } from "components/ConversationList";
import { MessageComposer } from "components/MessageComposer";
import { MessageList } from "components/MessageList";
import { useConversations } from "hooks/useConversations";
import { useMessages } from "hooks/useMessages";
import { useSendMessage } from "hooks/useSendMessage";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { queryClient } from "~/queryClient";

export default function ChatPage() {
    const [params, setParams] = useSearchParams();
    const activeId = params.get("c");

    const qc = useQueryClient();
    const conversationsQ = useConversations();

    const createConvM = useMutation({
        mutationFn: createConversation,
        onMutate: async (data) => {
            console.log({ conversationData: data })
            const conversationQueryKey = ["conversations"];
            await queryClient.cancelQueries({ queryKey: conversationQueryKey })
            const previousConversations = queryClient.getQueryData(conversationQueryKey)
            queryClient.setQueryData(conversationQueryKey, (old: unknown) => {
                if (Array.isArray(old)) {
                    return [...old, { id: data, title: "" }]
                }
                else return []
            })
            return previousConversations
        },
        onError: async (error, newConversation, context) => {
            console.log(error)
            queryClient.setQueryData(["conversations"], context?.previousConversations ?? [])
        },
        onSuccess: (data) => {
            setParams({ c: data.conversation.id })
        }


    });

    const selectedConversationId = useMemo(() => {
        if (activeId) return activeId;
        const first = conversationsQ.data?.conversations?.[0];
        return first?.id ?? crypto.randomUUID();
    }, [activeId, conversationsQ.data?.conversations]);


    const messagesQ = useMessages(selectedConversationId, {
        enabled: !!activeId
    });
    const sendM = useSendMessage(selectedConversationId);

    function onSelectConversation(id: string) {
        setParams({ c: id });
    }

    function onNewChat() {
        const id = crypto.randomUUID()
        createConvM.mutate(id);
    }

    function onSend(text: string) {

        if (!activeId) {
            const id = crypto.randomUUID()
            console.log("conversationId", id)
            createConvM.mutate(id)
        }
        sendM.mutate(text);
    }

    const messages = messagesQ.data?.messages ?? [];
    const convs = conversationsQ.data?.conversations ?? [];

    return (
        <ChatLayout
            sidebar={
                <ConversationList
                    conversations={convs}
                    activeId={selectedConversationId}
                    onSelect={onSelectConversation}
                    onNewChat={onNewChat}
                    isLoading={conversationsQ.isLoading}
                />
            }
            main={
                <div className="h-[calc(100vh-24px)] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 grid grid-rows-[auto_1fr_auto]">
                    <div className="border-b border-slate-800 p-4">
                        <div className="font-bold tracking-tight">
                            {selectedConversationId ? "Conversation" : "No chat selected"}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                            Chat with your LLM
                        </div>
                    </div>

                    <div className="overflow-auto p-4">
                        <MessageList
                            messages={messages ?? []}
                            isStreaming={sendM.isPending}
                            error={messagesQ.error ? String(messagesQ.error) : null}
                        />
                    </div>

                    <div className="border-t border-slate-800 bg-black/10 p-3">
                        <MessageComposer
                            disabled={false}
                            onSend={onSend}
                            isSending={sendM.isPending}
                        />
                        {sendM.error ? (
                            <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
                                {String(sendM.error)}
                            </div>
                        ) : null}
                    </div>
                </div>
            }
        />
    );
}