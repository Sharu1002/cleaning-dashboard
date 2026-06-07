"use client";

import type { Feedback } from "@/types";
import {
  STATUS_BADGE,
  URGENCY_DOT,
  daysSince,
  formatDate,
  getDisplayStatus,
} from "@/lib/feedback-utils";

type FeedbackCardProps = {
  feedback: Feedback;
  onForward: (feedback: Feedback) => void;
  onDone: (feedback: Feedback) => void;
  onReply: (feedback: Feedback) => void;
  onDelete: (feedback: Feedback) => void;
  deleting?: boolean;
};

const URGENCY_LABEL: Record<Feedback["urgency"], string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

export function FeedbackCard({
  feedback,
  onForward,
  onDone,
  onReply,
  onDelete,
  deleting = false,
}: FeedbackCardProps) {
  const displayStatus = getDisplayStatus(feedback);
  const badge = STATUS_BADGE[displayStatus];

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md border-l-4 ${badge.accent}`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ring-2 ring-white ${URGENCY_DOT[feedback.urgency]}`}
                title={URGENCY_LABEL[feedback.urgency]}
              />
              <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                {feedback.client_name}
              </h3>
            </div>
            {feedback.client_email && (
              <p className="mt-1 truncate pl-5 text-sm text-slate-500">{feedback.client_email}</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 px-4 py-3">
          {feedback.summary && (
            <p className="text-sm font-semibold leading-snug text-slate-800">{feedback.summary}</p>
          )}
          <p className="text-sm leading-relaxed text-slate-600">{feedback.full_feedback}</p>
        </div>

        {feedback.internal_note && (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-amber-50/50 px-3 py-2 text-sm italic text-slate-500">
            {feedback.internal_note}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <MetaChip>Created {formatDate(feedback.created_at)}</MetaChip>
          {feedback.assigned_cleaner && (
            <MetaChip>Assigned to {feedback.assigned_cleaner}</MetaChip>
          )}
          <MetaChip>
            {daysSince(feedback.created_at)} day{daysSince(feedback.created_at) !== 1 ? "s" : ""}{" "}
            ago
          </MetaChip>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <CardAction feedback={feedback} onForward={onForward} onDone={onDone} onReply={onReply} />
          <button
            type="button"
            onClick={() => onDelete(feedback)}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label={`Delete feedback from ${feedback.client_name}`}
          >
            <TrashIcon />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

function CardAction({
  feedback,
  onForward,
  onDone,
  onReply,
}: FeedbackCardProps) {
  const btn =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98]";

  switch (feedback.status) {
    case "new":
      return (
        <button
          type="button"
          onClick={() => onForward(feedback)}
          className={`${btn} bg-blue-600 text-white hover:bg-blue-700 hover:shadow`}
        >
          Forward to cleaner
        </button>
      );
    case "forwarded":
      return (
        <button
          type="button"
          onClick={() => onDone(feedback)}
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow`}
        >
          Mark as done
        </button>
      );
    case "done":
      return (
        <button
          type="button"
          onClick={() => onReply(feedback)}
          className={`${btn} bg-slate-800 text-white hover:bg-slate-900 hover:shadow`}
        >
          Reply to customer
        </button>
      );
    case "replied":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
          <span className="text-emerald-500">✓</span> Closed
        </span>
      );
  }
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
