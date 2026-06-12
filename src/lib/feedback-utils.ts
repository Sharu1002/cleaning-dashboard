import type { Feedback, Status } from "@/types";

export type Filter = "all" | "open" | Status | "overdue";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function isOverdue(feedback: Feedback): boolean {
  const now = Date.now();

  if (feedback.status === "new") {
    return now - new Date(feedback.created_at).getTime() > DAY_MS;
  }

  if (feedback.status === "forwarded" && feedback.forwarded_at) {
    return now - new Date(feedback.forwarded_at).getTime() > 48 * HOUR_MS;
  }

  if (feedback.status === "done" && feedback.done_at) {
    return now - new Date(feedback.done_at).getTime() > DAY_MS;
  }

  return false;
}

export function getDisplayStatus(feedback: Feedback): Status | "overdue" {
  return isOverdue(feedback) ? "overdue" : feedback.status;
}

export function filterFeedbacks(feedbacks: Feedback[], filter: Filter): Feedback[] {
  if (filter === "all") return feedbacks;
  if (filter === "open") return feedbacks.filter((f) => f.status !== "replied");
  if (filter === "overdue") return feedbacks.filter(isOverdue);
  return feedbacks.filter((f) => f.status === filter);
}

export function normalizeClientName(name: string): string {
  return name.trim().toLowerCase();
}

export function filterByClientName(
  feedbacks: Feedback[],
  clientKey: string | null,
): Feedback[] {
  if (!clientKey) return feedbacks;
  return feedbacks.filter(
    (feedback) => normalizeClientName(feedback.client_name) === clientKey,
  );
}

export function getClientNameOptions(
  feedbacks: Feedback[],
): { key: string; label: string }[] {
  const options = new Map<string, string>();

  for (const feedback of feedbacks) {
    const key = normalizeClientName(feedback.client_name);
    if (!key || options.has(key)) continue;
    options.set(key, feedback.client_name.trim());
  }

  return Array.from(options.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function getStats(feedbacks: Feedback[]) {
  const overdueCount = feedbacks.filter(isOverdue).length;
  const openCount = feedbacks.filter((f) => f.status !== "replied").length;
  const awaitingReplyCount = feedbacks.filter((f) => f.status === "done").length;

  return {
    total: feedbacks.length,
    open: openCount,
    overdue: overdueCount,
    awaitingReply: awaitingReplyCount,
  };
}

export const STATUS_BADGE: Record<
  Status | "overdue",
  { label: string; className: string; accent: string }
> = {
  new: {
    label: "New",
    className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
    accent: "border-l-amber-400",
  },
  forwarded: {
    label: "Forwarded",
    className: "bg-blue-50 text-blue-800 ring-1 ring-blue-200/80",
    accent: "border-l-blue-500",
  },
  done: {
    label: "Done",
    className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
    accent: "border-l-emerald-500",
  },
  replied: {
    label: "Replied",
    className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
    accent: "border-l-slate-400",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-50 text-red-800 ring-1 ring-red-200/80",
    accent: "border-l-red-500",
  },
};

export const URGENCY_DOT: Record<Feedback["urgency"], string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

export const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "forwarded", label: "Forwarded" },
  { value: "done", label: "Done — pending reply" },
  { value: "replied", label: "Closed" },
  { value: "overdue", label: "Overdue" },
];
