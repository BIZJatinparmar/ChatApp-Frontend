type StreamChunk =
  | {
      type: "token";
      content: string;
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      error: string;
    };

export async function* readNdjsonStream(
  response: Response,
  signal: AbortSignal,
): AsyncGenerator<{ type: "token"; content: string }> {
  if (!response.body) {
    throw new Error("Response body is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const abortReader = () => {
    void reader.cancel();
  };

  signal.addEventListener("abort", abortReader, { once: true });

  const processLine = (
    line: string,
  ): { shouldStop: boolean; chunk?: { type: "token"; content: string } } => {
    const trimmed = line.trim();

    if (!trimmed) {
      return { shouldStop: false };
    }

    if (trimmed === "[DONE]") {
      return { shouldStop: true };
    }

    const parsed = JSON.parse(trimmed) as StreamChunk;

    if (parsed.type === "done") {
      return { shouldStop: true };
    }

    if (parsed.type === "error") {
      throw new Error(parsed.error);
    }

    if (parsed.type === "token") {
      return {
        shouldStop: false,
        chunk: parsed,
      };
    }

    return { shouldStop: false };
  };

  try {
    while (true) {
      console.log("inside while");
      if (signal.aborted) {
        return;
      }

      const { done, value } = await reader.read();

      if (done) {
        buffer += decoder.decode();

        if (buffer.trim()) {
          const result = processLine(buffer);

          if (result.chunk) {
            yield result.chunk;
          }
        }

        return;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const result = processLine(line);

        if (result.chunk) {
          yield result.chunk;
        }

        if (result.shouldStop) {
          return;
        }
      }
    }
  } finally {
    console.log("Exiting while");
    signal.removeEventListener("abort", abortReader);
    reader.releaseLock();
  }
}
