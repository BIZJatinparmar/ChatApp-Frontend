import { apiFetch } from "./client";
import type {
    ListMessagesResponse,
    SendMessageRequest,
    SendMessageResponse,
} from "./types";

export async function listMessages(conversationId: string, signal?: AbortSignal) {
    return apiFetch<ListMessagesResponse>(
        `/conversation/${conversationId}/messages`,
        { signal },
    );
}

export async function sendMessage(input: SendMessageRequest) {
    return apiFetch<SendMessageResponse>(
        "/message/messages",
        {
            method: "POST",
            body: {
                id: crypto.randomUUID(),
                conversationId: input.conversationId,
                role: "user",
                content: input.content,
            },
        },
    );
}
