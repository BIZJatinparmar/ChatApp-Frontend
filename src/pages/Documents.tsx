import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { type ChangeEvent, useMemo, useRef, useState } from "react";
import {
  listDocuments,
  uploadDocument,
} from "../api/documents";
import { ApiError } from "../api/client";
import type { UserDocument } from "../api/types";
import { DocumentPreviewModal } from "../components/DocumentPreviewModal";

const acceptedTypes = ".pdf,.txt,application/pdf,text/plain";

export function Documents() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDocument, setPreviewDocument] = useState<UserDocument | null>(null);

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: ({ signal }) => listDocuments(signal),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const documents = useMemo(
    () => documentsQuery.data?.documents ?? [],
    [documentsQuery.data],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1b1b1b]">
            Documents
          </h1>
          <p className="mt-1 text-sm text-[#5d5f5e]">
            Upload PDF and text files for your chats to reference.
          </p>
        </div>

        <section className="rounded-lg border border-[#e2e2e2] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Upload size={18} className="text-[#4648d4]" />
            <h2 className="text-base font-semibold">Upload document</h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#c9c8d3] bg-[#fcf9f8] px-4 py-3 text-sm text-[#464554] hover:border-[#4648d4]">
              <FileText size={18} className="shrink-0 text-[#4648d4]" />
              <span className="min-w-0 flex-1 truncate">
                {selectedFile ? selectedFile.name : "Choose a PDF or TXT file"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <div className="flex min-h-12 items-center text-sm text-[#5d5f5e]">
              {selectedFile ? formatBytes(selectedFile.size) : "No file selected"}
            </div>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#4648d4] px-4 text-sm font-semibold text-white hover:bg-[#393bb7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </button>
          </div>

          {uploadMutation.error && (
            <StatusMessage tone="error" message={getErrorMessage(uploadMutation.error)} />
          )}
          {uploadMutation.isSuccess && (
            <StatusMessage tone="success" message="Document uploaded and indexed." />
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e2e2e2] bg-white shadow-sm">
          <div className="border-b border-[#e2e2e2] px-4 py-3">
            <h2 className="text-base font-semibold">Library</h2>
          </div>

          {documentsQuery.isLoading ? (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-[#5d5f5e]">
              <Loader2 size={16} className="animate-spin" />
              Loading documents...
            </div>
          ) : documentsQuery.error ? (
            <div className="px-4 py-8 text-sm text-red-700">
              {getErrorMessage(documentsQuery.error)}
            </div>
          ) : documents.length === 0 ? (
            <div className="px-4 py-8 text-sm text-[#5d5f5e]">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-[#f7f4f3] text-xs uppercase text-[#5d5f5e]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Document</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Chunks</th>
                    <th className="px-4 py-3 font-semibold">Uploaded</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e2e2]">
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td className="max-w-[300px] px-4 py-3 align-top">
                        <div className="truncate font-medium text-[#1b1b1b]">
                          {document.filename}
                        </div>
                        <div className="text-xs text-[#767586]">{document.id}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-[#464554]">
                        {document.filetype.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 align-top text-[#464554]">
                        {formatBytes(document.size_bytes)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={document.status} />
                      </td>
                      <td className="px-4 py-3 align-top text-[#464554]">
                        {document.chunk_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 align-top text-[#464554]">
                        {new Date(document.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(document)}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d4d4d8] bg-white px-3 text-sm font-medium text-[#464554] hover:border-[#4648d4] hover:text-[#4648d4]"
                        >
                          <Eye size={15} />
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {previewDocument && (
        <DocumentPreviewModal
          documentId={previewDocument.id}
          filename={previewDocument.filename}
          contentType={previewDocument.content_type}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "ready"
      ? "bg-green-50 text-green-700"
      : status === "failed"
        ? "bg-red-50 text-red-700"
        : "bg-[#f0eded] text-[#464554]";

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${tone}`}>
      {status}
    </span>
  );
}

function StatusMessage({
  tone,
  message,
}: {
  tone: "success" | "error";
  message: string;
}) {
  const isSuccess = tone === "success";

  return (
    <div
      className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        isSuccess
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
