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
};

export function FeedbackCard({ feedback, onForward, onDone, onReply }: FeedbackCardProps) {
  const displayStatus = getDisplayStatus(feedback);
  const badge = STATUS_BADGE[displayStatus];

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${URGENCY_DOT[feedback.urgency]}`}
            title={`${feedback.urgency} urgency`}
          />
          <h3 className="text-base font-semibold text-gray-900">{feedback.client_name}</h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {feedback.client_email && (
        <p className="mt-2 text-sm text-gray-500">{feedback.client_email}</p>
      )}

      <div className="mt-3 space-y-2">
        {feedback.summary && (
          <p className="text-sm font-semibold text-gray-800">{feedback.summary}</p>
        )}
        <p className="text-sm leading-relaxed text-gray-600">{feedback.full_feedback}</p>
      </div>

      {feedback.internal_note && (
        <p className="mt-3 text-sm italic text-gray-400">{feedback.internal_note}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Created {formatDate(feedback.created_at)}</span>
        {feedback.assigned_cleaner && (
          <span>Assigned to {feedback.assigned_cleaner}</span>
        )}
        <span>
          {daysSince(feedback.created_at)} day{daysSince(feedback.created_at) !== 1 ? "s" : ""} ago
        </span>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <CardAction feedback={feedback} onForward={onForward} onDone={onDone} onReply={onReply} />
      </div>
    </article>
  );
}

function CardAction({
  feedback,
  onForward,
  onDone,
  onReply,
}: FeedbackCardProps) {
  switch (feedback.status) {
    case "new":
      return (
        <button
          type="button"
          onClick={() => onForward(feedback)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Forward to cleaner
        </button>
      );
    case "forwarded":
      return (
        <button
          type="button"
          onClick={() => onDone(feedback)}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Mark as done
        </button>
      );
    case "done":
      return (
        <button
          type="button"
          onClick={() => onReply(feedback)}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          Reply to customer
        </button>
      );
    case "replied":
      return <span className="text-sm font-medium text-gray-400">Closed</span>;
  }
}
