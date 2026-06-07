import type { Filter } from "@/lib/feedback-utils";

const EMPTY_MESSAGES: Record<Filter, { icon: string; message: string }> = {
  all: {
    icon: "inbox",
    message: "No feedback yet. Forward a customer email to add the first case.",
  },
  open: { icon: "check", message: "No open cases. All caught up!" },
  overdue: {
    icon: "check",
    message: "No overdue cases. Great work!",
  },
  new: { icon: "filter", message: "No cases in this view." },
  forwarded: { icon: "filter", message: "No cases in this view." },
  done: { icon: "filter", message: "No cases in this view." },
  replied: { icon: "filter", message: "No cases in this view." },
};

export function EmptyState({ filter }: { filter: Filter }) {
  const { icon, message } = EMPTY_MESSAGES[filter];

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        {icon === "inbox" && <InboxIcon />}
        {icon === "check" && <CheckIcon />}
        {icon === "filter" && <FilterIcon />}
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">{message}</p>
    </div>
  );
}

function InboxIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
