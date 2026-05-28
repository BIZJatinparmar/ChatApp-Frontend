import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import { getMe, loginWithMicrosoftToken, logout } from "../api/auth";
import { ApiError } from "../api/client";
import type { User } from "../api/types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  loginWithIdToken: (idToken: string) => Promise<User>;
  logoutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: ({ signal }) => getMe(signal),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginWithMicrosoftToken,
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isLoading: meQuery.isLoading,
      loginWithIdToken: loginMutation.mutateAsync,
      logoutUser: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [
      loginMutation.mutateAsync,
      logoutMutation.mutateAsync,
      meQuery.data,
      meQuery.isLoading,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
