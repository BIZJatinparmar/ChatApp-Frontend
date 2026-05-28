import { useAuth } from "../auth/AuthContext";

export function useLogin() {
  return useAuth();
}
