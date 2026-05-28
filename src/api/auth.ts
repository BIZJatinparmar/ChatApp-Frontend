import { apiFetch } from "./client";
import type { User } from "./types";

export async function getMe(signal?: AbortSignal) {
  return apiFetch<User>("/me", { signal });
}

export async function loginWithMicrosoftToken(idToken: string) {
  return apiFetch<User>("/auth/microsoft/login", {
    method: "POST",
    body: { id_token: idToken },
  });
}

export async function logout() {
  return apiFetch<{ ok: boolean }>("/auth/logout", {
    method: "POST",
  });
}
