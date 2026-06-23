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
  payloadJson: MessagePayload | string | null;
  createdAt: string; // ISO
};

export type Citation = {
  index: number;
  documentId: string;
  fileName: string;
  page?: number | string | null;
  quote?: string | null;
  previewUrl?: string;
};

export type MessagePayload = {
  citations?: Citation[];
  citation_count?: number;
  [key: string]: unknown;
};

export type CreateConversationResponse = {
  id: string;
  owner_id: string;
  title: string;
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
  message: Message;
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
  token_budget: number;
};

export type AdminUserCreateInput = {
  microsoft_oid: string;
  email?: string | null;
  role: AppRole;
  permissions: string[];
  token_budget: number;
};

export type AdminUserUpdateInput = {
  role?: AppRole;
  is_active?: boolean;
  permissions?: string[];
  token_budget?: number;
};

export type DailyUsagePoint = {
  date: string;
  active_users: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

export type BudgetRequestStatus = "pending" | "approved" | "rejected";

export type BudgetRequest = {
  id: string;
  user_id: string;
  user_email: string | null;
  requested_tokens: number;
  status: BudgetRequestStatus;
  note: string | null;
  admin_note: string | null;
  decided_by_user_id: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BudgetRequestCreateInput = {
  requested_tokens: number;
  note?: string | null;
};

export type BudgetRequestAdminUpdateInput = {
  status: BudgetRequestStatus;
  approved_tokens?: number | null;
  admin_note?: string | null;
};

export type DocumentStatus = "processing" | "ready" | "failed";

export type UserDocument = {
  id: string;
  filename: string;
  content_type: string;
  filetype: "pdf" | "txt" | string;
  size_bytes: number;
  status: DocumentStatus | string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
};

export type DocumentListResponse = {
  documents: UserDocument[];
};
