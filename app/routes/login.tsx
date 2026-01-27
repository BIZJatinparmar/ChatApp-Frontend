import { AuthForm } from "components/AuthForm";
import type { Route } from "./+types/login";
import { apiFetch } from "api/client";
import { redirect } from "react-router";

export async function clientAction({ request }: Route.ClientActionArgs) {
    let formData = await request.formData();
    let email = formData.get("email");
    const password = formData.get("password")
    let login = await apiFetch<{ "ok": boolean }>("/auth/login", {
        method: "POST",
        body: {
            email,
            password
        }
    })
    if (login.ok) {
        return redirect("/chat")
    }
    return login
}

export default function Login({ actionData }: Route.ComponentProps) {
    console.log({ actionData })
    return <AuthForm initialMode="login" onSubmit={() => { }} />
}