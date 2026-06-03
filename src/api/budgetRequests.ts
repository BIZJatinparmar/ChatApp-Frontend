import { apiFetch } from "./client";
import type {
  BudgetRequest,
  BudgetRequestAdminUpdateInput,
  BudgetRequestCreateInput,
} from "./types";

export async function createBudgetRequest(input: BudgetRequestCreateInput) {
  return apiFetch<BudgetRequest>("/budget-requests", {
    method: "POST",
    body: input,
  });
}

export async function listMyBudgetRequests(signal?: AbortSignal) {
  return apiFetch<BudgetRequest[]>("/budget-requests/me", { signal });
}

export async function listAdminBudgetRequests(signal?: AbortSignal) {
  return apiFetch<BudgetRequest[]>("/admin/budget-requests", { signal });
}

export async function updateAdminBudgetRequest(
  requestId: string,
  input: BudgetRequestAdminUpdateInput,
) {
  return apiFetch<BudgetRequest>(`/admin/budget-requests/${requestId}`, {
    method: "PATCH",
    body: input,
  });
}
