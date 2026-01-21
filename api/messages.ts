import { apiFetch } from "./client";
import type {
    ListMessagesResponse,
    SendMessageRequest,
    SendMessageResponse,
} from "./types";

export async function listMessages(conversationId: string, signal?: AbortSignal) {
    return apiFetch<ListMessagesResponse>(
        `/api/conversations/${conversationId}/messages`,
        { signal },
    );
}

export async function sendMessage(input: SendMessageRequest) {
    return apiFetch<SendMessageResponse>(
        `/api/conversations/${input.conversationId}/messages`,
        {
            method: "POST",
            body: { content: input.content },
        },
    );
}