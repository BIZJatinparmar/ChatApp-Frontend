export type ChatEvent = string

function splitLines(buffer: string) {
    const lines = buffer.split("\n");
    const tail = lines.pop() ?? "";
    return { lines, tail };
}

export async function streamChat(params: {
    body: unknown;
    signal?: AbortSignal;
    onEvent: (ev: ChatEvent, id: string) => void;
}) {
    const res = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params.body),
        signal: params.signal,
    });

    if (!res.ok || !res.body) {
        throw new Error(`Stream failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const id = crypto.randomUUID()
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer = decoder.decode(value, { stream: true });

        params.onEvent(buffer, id);

    }
}