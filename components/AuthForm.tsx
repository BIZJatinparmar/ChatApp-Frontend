import React, { useMemo, useState } from "react";
import { Form } from "react-router";

type AuthMode = "login" | "signup";

type AuthValues = {
    email: string;
    password: string;
};

type AuthErrors = Partial<Record<keyof AuthValues, string>>;

type AuthFormProps = {
    /**
     * Called when the user submits either Login or Sign up.
     * You decide what to do (API call, Firebase, etc.).
     */
    onSubmit: (args: { mode: AuthMode; values: AuthValues }) => void | Promise<void>;

    /**
     * Optional starting mode.
     * Default: "login"
     */
    initialMode?: AuthMode;

    /**
     * Optional: show a loading state while your async submit runs.
     */
    loading?: boolean;

    /**
     * Optional: display an error message from your backend.
     */
    serverError?: string | null;
};

function validate(values: AuthValues): AuthErrors {
    const errors: AuthErrors = {};

    const email = values.email.trim();
    if (!email) errors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email.";

    if (!values.password) errors.password = "Password is required.";
    else if (values.password.length < 8)
        errors.password = "Password must be at least 8 characters.";

    return errors;
}

export function AuthForm({
    onSubmit,
    initialMode = "login",
    loading = false,
    serverError = null,
}: AuthFormProps) {
    const [mode, setMode] = useState<AuthMode>(initialMode);


    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                <div className="p-6 sm:p-8">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {mode === "login" ? "Welcome back" : "Create your account"}
                    </h1>
                    <p className="mt-2 text-sm text-slate-300">
                        {mode === "login"
                            ? "Log in with your email and password."
                            : "Sign up with your email and password."}
                    </p>

                    <Form method="POST" className="mt-6 space-y-4">
                        {serverError ? (
                            <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                                {serverError}
                            </div>
                        ) : null}

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-200">
                                Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                className={[
                                    "w-full rounded-xl border bg-slate-950/40 px-3 py-2.5 text-sm outline-none",
                                    "placeholder:text-slate-500",
                                    "focus:ring-2 focus:ring-sky-500/40",

                                ].join(" ")}
                            />

                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-200">
                                Password
                            </label>
                            <input
                                name="password"
                                type="password"
                                autoComplete={mode === "login" ? "current-password" : "new-password"}
                                placeholder="••••••••"
                                className={[
                                    "w-full rounded-xl border bg-slate-950/40 px-3 py-2.5 text-sm outline-none",
                                    "placeholder:text-slate-500",
                                    "focus:ring-2 focus:ring-sky-500/40",

                                ].join(" ")}
                            />

                            <p className="text-xs text-slate-400">
                                Minimum 8 characters.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={[
                                "w-full rounded-xl px-4 py-2.5 text-sm font-medium transition",
                                "bg-sky-600 hover:bg-sky-500 text-white",
                                "disabled:opacity-60 disabled:cursor-not-allowed",
                            ].join(" ")}
                        >
                            {loading
                                ? mode === "login"
                                    ? "Logging in…"
                                    : "Creating account…"
                                : mode === "login"
                                    ? "Log in"
                                    : "Sign up"}
                        </button>

                        <div className="flex items-center justify-center gap-2 pt-1 text-sm text-slate-300">
                            <span>
                                {mode === "login"
                                    ? "New here?"
                                    : "Already have an account?"}
                            </span>
                            <button
                                type="submit"
                                className="font-medium text-sky-300 hover:text-sky-200"
                            >
                                {mode === "login" ? "Sign up" : "Log in"}
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}