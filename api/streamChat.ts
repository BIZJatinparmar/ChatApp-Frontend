
export type ChatEvent = {
    type: "token" | "error";
    content?: string;
    message?: string;
}

function splitLines(buffer: string) {
    const lines = buffer.split("\n");
    const dataLines = lines
        .filter(line => line)
        .map(line => line.trim())
        .map(line => JSON.parse(line) as ChatEvent);
    return dataLines;
}

export async function streamChat(params: {
    body: unknown;
    signal?: AbortSignal;
    onEvent: (ev: ChatEvent, id: string) => void;
}) {
    const res = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        credentials: "include",
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
        const data = splitLines(buffer);
        console.log(data)
        for (const dataEvent of data) {
            params.onEvent(dataEvent, id);
        }

    }
}