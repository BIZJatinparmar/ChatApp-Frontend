import type { ReactNode } from "react";

export function ChatLayout(props: { sidebar: ReactNode; main: ReactNode }) {
    return (
        <div className="h-screen bg-slate-950 text-slate-100">
            <div className="grid h-full grid-cols-[320px_1fr]">
                <aside className="border-r border-slate-800 bg-slate-900 p-3 overflow-auto">
                    {props.sidebar}
                </aside>

                <main className="p-3 overflow-hidden">{props.main}</main>
            </div>
        </div>
    );
}