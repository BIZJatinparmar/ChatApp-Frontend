import React, { useState } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
};

export function FileUploadModal({ open, onClose }: Props) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    if (!open) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setFiles(Array.from(e.target.files));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);
        await new Promise((r) => setTimeout(r, 800));
        console.log("Uploaded files:", files);
        setIsUploading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
            <div className="relative w-full max-w-md rounded-lg bg-slate-900 p-6">
                <h3 className="text-lg font-semibold">Upload Files</h3>
                <input
                    type="file"
                    multiple
                    onChange={handleChange}
                    className="mt-4 w-full"
                />

                {files.length > 0 && (
                    <ul className="mt-3 max-h-40 overflow-auto text-sm">
                        {files.map((f, i) => (
                            <li key={i} className="flex justify-between py-1">
                                <span className="truncate">{f.name}</span>
                                <span className="text-slate-400 ml-2">{(f.size / 1024).toFixed(1)} KB</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        className="rounded-lg border px-3 py-2 text-sm"
                        onClick={onClose}
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-60"
                        onClick={handleUpload}
                        disabled={isUploading || files.length === 0}
                    >
                        {isUploading ? "Uploading…" : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FileUploadModal;
