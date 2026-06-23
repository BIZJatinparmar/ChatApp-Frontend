import { X } from "lucide-react";
import { getDocumentPreviewUrl } from "../api/documents";

type DocumentPreviewModalProps = {
  documentId: string;
  filename: string;
  contentType?: string | null;
  page?: number | string | null;
  onClose: () => void;
};

export function DocumentPreviewModal({
  documentId,
  filename,
  contentType,
  page,
  onClose,
}: DocumentPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#e2e2e2] px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[#1b1b1b]">
              {filename}
            </h2>
            {contentType && (
              <div className="text-xs text-[#767586]">{contentType}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#464554] hover:bg-[#f0eded]"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>
        <iframe
          title={`Preview ${filename}`}
          src={getDocumentPreviewUrl(documentId, page)}
          className="h-full w-full bg-white"
        />
      </div>
    </div>
  );
}
