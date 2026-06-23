import { useMemo, useState } from "react";
import type { Citation, Message, MessagePayload } from "../api/types";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

type MessageProps = {
  message: Message;
};

export const MessageRow = ({ message }: MessageProps) => {
  const citations = useMemo(() => getMessageCitations(message), [message]);
  const [previewCitation, setPreviewCitation] = useState<Citation | null>(null);
  const content = useMemo(
    () => linkCitationMarkers(message.content, citations),
    [message.content, citations],
  );

  return (
    <div
      key={message.id}
      className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
          message.role === "user"
            ? "bg-[#f0eded] text-[#1b1b1b]"
            : "bg-transparent text-[#1b1b1b]"
        }`}
      >
        {message.role === "assistant" && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-[#4648d4] text-white flex items-center justify-center text-xs font-bold">
              C
            </div>
            <span className="font-medium">Assistant</span>
          </div>
        )}

        {!message.content && (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-[#c7c4d7] animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[#c7c4d7] animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[#c7c4d7] animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}

        <div className="prose prose-sm max-w-none dark:prose-invert text-black">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children, ...props }) => {
                const citation = getCitationFromHref(href, citations);

                if (citation) {
                  return (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewCitation(citation);
                      }}
                      className="mx-0.5 inline-flex min-h-5 items-center rounded-md border border-[#cfd3ff] bg-white px-1.5 text-xs font-semibold !text-[#3436b8] no-underline shadow-sm hover:bg-[#eef0ff]"
                    >
                      {children}
                    </button>
                  );
                }

                return (
                  <a href={href} {...props}>
                    {children}
                  </a>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {message.role === "assistant" && citations.length > 0 && (
          <CitationList
            citations={citations}
            onPreview={(citation) => setPreviewCitation(citation)}
          />
        )}
      </div>

      {previewCitation && (
        <DocumentPreviewModal
          documentId={previewCitation.documentId}
          filename={previewCitation.fileName}
          page={previewCitation.page}
          onClose={() => setPreviewCitation(null)}
        />
      )}
    </div>
  );
};

function CitationList({
  citations,
  onPreview,
}: {
  citations: Citation[];
  onPreview: (citation: Citation) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-[#e2e2e2] pt-3">
      {citations.map((citation) => (
        <button
          key={`${citation.index}-${citation.documentId}`}
          type="button"
          onClick={() => onPreview(citation)}
          className="w-full rounded-lg border border-[#e2e2e2] bg-white px-3 py-2 text-left text-sm hover:border-[#4648d4] hover:bg-[#f8f8ff]"
        >
          <div className="flex items-center gap-2 text-[#1b1b1b]">
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[#eef0ff] px-1 text-xs font-semibold text-[#4648d4]">
              {citation.index}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {citation.fileName}
            </span>
            {citation.page && (
              <span className="shrink-0 text-xs text-[#767586]">
                Page {citation.page}
              </span>
            )}
          </div>
          {citation.quote && (
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-[#5d5f5e]">
              {citation.quote}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export function getMessageCitations(message: Message): Citation[] {
  const payload = parsePayload(message.payloadJson);
  const citations = Array.isArray(payload?.citations) ? payload.citations : [];
  const usedIndexes = getUsedCitationIndexes(message.content);

  return citations
    .filter(isCitation)
    .filter((citation) => usedIndexes.has(citation.index))
    .sort((a, b) => a.index - b.index);
}

function parsePayload(payloadJson: Message["payloadJson"]): MessagePayload | null {
  if (!payloadJson) {
    return null;
  }

  if (typeof payloadJson === "string") {
    if (!payloadJson.trim()) {
      return null;
    }

    try {
      return JSON.parse(payloadJson) as MessagePayload;
    } catch {
      return null;
    }
  }

  return payloadJson;
}

function isCitation(value: unknown): value is Citation {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const citation = value as Partial<Citation>;
  return (
    typeof citation.index === "number" &&
    Number.isFinite(citation.index) &&
    typeof citation.documentId === "string" &&
    citation.documentId.length > 0 &&
    typeof citation.fileName === "string" &&
    citation.fileName.length > 0
  );
}

export function linkCitationMarkers(content: string, citations: Citation[]) {
  const normalizedContent = normalizeCitationMarkdownLinks(content);

  if (citations.length === 0) {
    return normalizedContent;
  }

  const citationIndexes = new Set(citations.map((citation) => citation.index));
  return normalizedContent.replace(
    /\[(\d+)\](?!\()/g,
    (match, indexText: string) => {
      const index = Number(indexText);

      if (!citationIndexes.has(index)) {
        return match;
      }

      return `[${index}](#citation-preview-${index})`;
    },
  );
}

export function normalizeCitationMarkdownLinks(content: string) {
  return content.replace(/\[(\d+)\]\([^)\n]*\)/g, "[$1]");
}

function getUsedCitationIndexes(content: string) {
  const normalizedContent = normalizeCitationMarkdownLinks(content);
  const indexes = new Set<number>();

  for (const match of normalizedContent.matchAll(/\[(\d+)\]/g)) {
    const index = Number(match[1]);
    if (Number.isFinite(index) && index > 0) {
      indexes.add(index);
    }
  }

  return indexes;
}

function getCitationFromHref(href: string | undefined, citations: Citation[]) {
  if (!href?.startsWith("#citation-preview-")) {
    return null;
  }

  const index = Number(href.slice("#citation-preview-".length));
  return citations.find((citation) => citation.index === index) ?? null;
}
