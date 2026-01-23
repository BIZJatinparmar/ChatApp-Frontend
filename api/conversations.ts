import { apiFetch } from "./client";
import type {
    Conversation,
    CreateConversationResponse,
    ListConversationsResponse,
} from "./types";

export async function listConversations(signal?: AbortSignal) {
    return apiFetch<ListConversationsResponse>("/conversations", { signal });
}

export async function createConversation(id: string) {
    // You can optionally pass a title in body if your backend supports it
    return apiFetch<CreateConversationResponse>("/conversations", {
        method: "POST",
        body: {
            id: id,
            title: '',
        },
    });
}

export async function renameConversation(conversationId: string, title: string) {
    return apiFetch<{ conversation: Conversation }>(
        `/conversations/${conversationId}`,
        {
            method: "PATCH",
            body: { title },
        },
    );
}