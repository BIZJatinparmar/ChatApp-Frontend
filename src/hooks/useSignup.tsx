import { useAuth } from "../auth/AuthContext";

export const useSignup = () => {
  return useAuth();
}
