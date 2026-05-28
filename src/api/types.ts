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

export type AppRole = "admin" | "user";

export type User = {
  id: string;
  email: string | null;
  tenant_id: string | null;
  microsoft_oid: string | null;
  role: AppRole;
  auth_provider: string;
  is_active: boolean;
  permissions: string[];
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

export type AdminUserCreateInput = {
  microsoft_oid: string;
  email?: string | null;
  role: AppRole;
  permissions: string[];
};

export type AdminUserUpdateInput = {
  role?: AppRole;
  is_active?: boolean;
  permissions?: string[];
};
