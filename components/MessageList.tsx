
import type { Message } from "api/types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MessageList(props: {
    messages: Array<Message>;
    isLoading?: boolean;
    isStreaming?: boolean;
    error?: string | null;
}) {
    if (props.isLoading) {
        return <div className="text-sm text-slate-400">Loading messages…</div>;
    }

    if (props.error) {
        return (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {props.error}
            </div>
        );
    }

    if (props.messages.length === 0) {
        return <div className="text-sm text-slate-400">Say hi.</div>;
    }

    return (
        <div className="space-y-3">
            {props.messages.map((m, index) => {
                const isUser = m.role === 'user'
                return (
                    <div
                        key={index}
                        className={["flex", isUser ? "justify-end" : "justify-start"].join(
                            " ",
                        )}
                    >
                        <div
                            className={[
                                "max-w-[min(760px,85%)] rounded-2xl border px-3 py-2",
                                "bg-white/5 border-slate-800",
                                isUser ? "bg-indigo-500/15 border-indigo-500/30" : "",
                            ].join(" ")}
                        >
                            <div className="text-[11px] tracking-wider text-slate-400">
                                <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                            </div>
                            <div className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-100">

                            </div>
                            <div className="mt-2 text-[11px] text-slate-400">
                                {new Date(m.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                );
            })}

        </div>
    );
}