import { apiFetch } from "./client";
import type { CreateConversationResponse, ListConversationsResponse } from "./types";

export async function listConversations(signal?: AbortSignal) {
    return apiFetch<ListConversationsResponse>("/conversation/", { signal });
}

export async function createConversation(id: string) {
    return apiFetch<CreateConversationResponse>("/conversation/", {
        method: "POST",
        body: {
            id: id,
        },
    });
}

