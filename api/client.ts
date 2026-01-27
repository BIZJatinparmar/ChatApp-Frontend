const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.toString() ?? "http://localhost:8000";

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
};

export async function apiFetch<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const url = `${API_BASE_URL}${path}`;

    const res = await fetch(url, {
        method: options.method ?? "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
        const message =
            typeof body === "object" && body && "detail" in body
                ? String((body as any).detail)
                : `Request failed: ${res.status}`;
        throw new ApiError(message, res.status, body);
    }

    return body as T;
}