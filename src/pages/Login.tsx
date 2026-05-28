import { useMsal } from "@azure/msal-react";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { microsoftLoginRequest } from "../auth/msal";

type LocationState = {
  from?: {
    pathname?: string;
  };
  error?: string;
};

export function Login() {
  const { instance } = useMsal();
  const { user } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ?? "/";
  const authRedirectError = state?.error;

  const handleLogin = async () => {
    setError(null);
    setIsSigningIn(true);

    try {
      sessionStorage.setItem("postLoginRedirectPath", redirectTo);
      await instance.loginRedirect(microsoftLoginRequest);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to sign in.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcf9f8] text-[#1b1b1b] flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-lg border border-[#e2e2e2] bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#4648d4]">Chat App</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Sign in to continue
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#5d5f5e]">
            Use your Microsoft account. Admin-created users can sign in after
            their Microsoft Object ID is added.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {!error && authRedirectError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {authRedirectError}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={isSigningIn}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#4648d4] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#393bb7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogIn size={18} />
          {isSigningIn ? "Signing in..." : "Sign in with Microsoft"}
        </button>
      </section>
    </main>
  );
}
