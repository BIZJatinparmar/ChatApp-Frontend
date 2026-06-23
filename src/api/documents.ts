import { API_BASE_URL, ApiError } from "./client";
import type { DocumentListResponse, UserDocument } from "./types";

export async function listDocuments(signal?: AbortSignal): Promise<DocumentListResponse> {
  const res = await fetch(`${API_BASE_URL}/document`, {
    credentials: "include",
    signal,
  });

  const body = await parseBody(res);
  if (!res.ok) {
    throw buildApiError(res, body);
  }

  return body as DocumentListResponse;
}

export async function uploadDocument(file: File): Promise<UserDocument> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/document/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const body = await parseBody(res);
  if (!res.ok) {
    throw buildApiError(res, body);
  }

  return body as UserDocument;
}

export function getDocumentPreviewUrl(documentId: string, page?: number | string | null) {
  const url = `${API_BASE_URL}/document/${encodeURIComponent(documentId)}/preview`;
  const pageNumber = Number(page);

  if (Number.isFinite(pageNumber) && pageNumber > 0) {
    return `${url}#page=${pageNumber}`;
  }

  return url;
}

async function parseBody(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => null);
  }

  return res.text();
}

function buildApiError(res: Response, body: unknown) {
  const message =
    typeof body === "object" && body && "detail" in body
      ? String((body as { detail: unknown }).detail)
      : `Request failed: ${res.status}`;

  return new ApiError(message, res.status, body);
}
