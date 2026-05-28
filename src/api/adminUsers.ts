import { apiFetch } from "./client";
import type {
  AdminUserCreateInput,
  AdminUserUpdateInput,
  User,
} from "./types";

export async function listAdminUsers(signal?: AbortSignal) {
  return apiFetch<User[]>("/admin/users", { signal });
}

export async function createAdminUser(input: AdminUserCreateInput) {
  return apiFetch<User>("/admin/users", {
    method: "POST",
    body: input,
  });
}

export async function updateAdminUser(
  userId: string,
  input: AdminUserUpdateInput,
) {
  return apiFetch<User>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: input,
  });
}
