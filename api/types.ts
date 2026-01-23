export type Conversation = {
    id: string;
    ownerId: string;
    title: string;
    metadataJson: string;
    updatedAt: string;
};

export type Role = "user" | "assistant" | "system";

export type Message = {
    id: string;
    conversationId: string;
    role: Role;
    content: string;
    payloadJson: string;
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