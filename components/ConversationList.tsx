import { useState } from "react";
import { FileUploadModal } from "./FileUploadModal";
import type { Conversation } from "../api/types";

export function ConversationList(props: {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNewChat: () => void;
    isLoading?: boolean;
}) {
    const [fileUploadModal, setFileUploadModal] = useState(false);
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="font-bold tracking-tight">Chat UI</div>
                <button
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 active:scale-[0.99]"
                    onClick={props.onNewChat}
                    type="button"
                >
                    New chat
                </button>
            </div>
            <div className="flex items-center justify-between gap-2">
                <div className="font-bold tracking-tight">Add File</div>
                <button
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 active:scale-[0.99]"
                    onClick={() => setFileUploadModal(true)}
                    type="button"
                >
                    Upload Files
                </button>
            </div>

            {props.isLoading ? (
                <div className="text-sm text-slate-400">Loading chats…</div>
            ) : props.conversations.length === 0 ? (
                <div className="text-sm text-slate-400">No conversations yet.</div>
            ) : (
                <ul className="space-y-2">
                    {props.conversations.map((c) => {
                        const isActive = c.id === props.activeId;
                        return (
                            <li key={c.id}>
                                <button
                                    className={[
                                        "w-full rounded-xl border px-3 py-2 text-left transition",
                                        "bg-white/5 hover:bg-white/10 border-slate-800",
                                        isActive
                                            ? "border-indigo-400/60 bg-indigo-500/15"
                                            : "",
                                    ].join(" ")}
                                    onClick={() => props.onSelect(c.id)}
                                    title={c.title}
                                    type="button"
                                >
                                    <div className="truncate font-semibold">{c.title}</div>
                                    <div className="mt-1 text-xs text-slate-400">
                                        {new Date(c.updatedAt).toLocaleString()}
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <FileUploadModal open={fileUploadModal} onClose={() => setFileUploadModal(false)} />

        </div>
    );
}