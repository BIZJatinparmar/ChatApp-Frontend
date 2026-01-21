import { useMemo, useState } from "react";

export function MessageComposer(props: {
    disabled?: boolean;
    onSend: (text: string) => void;
    isSending?: boolean;
}) {
    const [text, setText] = useState("");

    const canSend = useMemo(() => {
        return !props.disabled && text.trim().length > 0 && !props.isSending;
    }, [props.disabled, props.isSending, text]);

    function send() {
        const value = text.trim();
        if (!value) return;
        props.onSend(value);
        setText("");
    }

    return (
        <div className="space-y-2">
            <textarea
                className={[
                    "w-full resize-y rounded-xl border px-3 py-2 text-sm",
                    "bg-white/5 border-slate-800 text-slate-100",
                    "placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
                    props.disabled ? "opacity-60" : "",
                ].join(" ")}
                placeholder="Message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={props.disabled}
                rows={3}
            />
            <div className="flex justify-end">
                <button
                    className={[
                        "rounded-lg px-4 py-2 text-sm font-medium",
                        "bg-indigo-500 hover:bg-indigo-400 text-slate-950",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "active:scale-[0.99]",
                    ].join(" ")}
                    onClick={send}
                    disabled={!canSend}
                    type="button"
                >
                    {props.isSending ? "Sending…" : "Send"}
                </button>
            </div>
        </div>
    );
}