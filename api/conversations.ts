import { apiFetch } from "./client";
import type {
    Conversation,
    CreateConversationResponse,
    ListConversationsResponse,
} from "./types";

export async function listConversations(signal?: AbortSignal) {
    return apiFetch<ListConversationsResponse>("/api/conversations", { signal });
}

export async function createConversation() {
    // You can optionally pass a title in body if your backend supports it
    return apiFetch<CreateConversationResponse>("/api/conversations", {
        method: "POST",
        body: {},
    });
}

export async function renameConversation(conversationId: string, title: string) {
    return apiFetch<{ conversation: Conversation }>(
        `/api/conversations/${conversationId}`,
        {
            method: "PATCH",
            body: { title },
        },
    );
}