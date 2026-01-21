export type Conversation = {
    id: string;
    title: string;
    updatedAt: string; // ISO
};

export type Role = "user" | "assistant" | "system";

export type Message = {
    id: string;
    conversationId: string;
    role: Role;
    content: string;
    createdAt: string; // ISO
};

export type CreateConversationResponse = {
    conversation: Conversation;
};

export type ListConversationsResponse = {
    conversations: Conversation[];
};

export type ListMessagesResponse = {
    messages: Message[];
};

export type SendMessageRequest = {
    conversationId: string;
    content: string;
};

export type SendMessageResponse = {
    userMessage: Message;
    assistantMessage: Message;
};