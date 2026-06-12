"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FeedbackSkeleton } from "@/components/FeedbackSkeleton";
import { DoneModal, ForwardModal, ReplyModal } from "@/components/FeedbackModals";
import { ToastProvider, useToast } from "@/components/Toast";
import {
  FILTER_OPTIONS,
  type Filter,
  filterByClientName,
  filterFeedbacks,
  getClientNameOptions,
  getStats,
  normalizeClientName,
} from "@/lib/feedback-utils";
import { getFeedbackChangeNotifications } from "@/lib/feedback-notifications";
import type { Cleaner, Feedback } from "@/types";

const REFRESH_INTERVAL_MS = 30_000;

export default function Home() {
  return (
    <ToastProvider>
      <Suspense fallback={<DashboardFallback />}>
        <Dashboard />
      </Suspense>
    </ToastProvider>
  );
}

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-[#f0f5fa]">
      <header className="bg-blue-800 shadow-md">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          <h1 className="text-xl font-bold text-white">KNK Palvelut Oy</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <FeedbackSkeleton />
      </main>
    </div>
  );
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<Feedback | null>(null);
  const [doneTarget, setDoneTarget] = useState<Feedback | null>(null);
  const [replyTarget, setReplyTarget] = useState<Feedback | null>(null);
  const previousFeedbacksRef = useRef<Feedback[] | null>(null);

  const fetchFeedbacks = useCallback(
    async (isManualRefresh = false, silent = false) => {
      if (isManualRefresh) setRefreshing(true);
      try {
        const res = await fetch("/api/feedbacks");
        if (!res.ok) throw new Error("Failed to fetch feedbacks");
        const data = (await res.json()) as Feedback[];

        if (!silent && previousFeedbacksRef.current !== null) {
          const messages = getFeedbackChangeNotifications(
            previousFeedbacksRef.current,
            data,
          );
          for (const message of messages) {
            showSuccess(message);
          }
        }

        previousFeedbacksRef.current = data;
        setFeedbacks(data);
      } catch (error) {
        console.error("Fetch feedbacks error:", error);
        if (isManualRefresh) {
          showError("Something went wrong, please try again");
        }
      } finally {
        setInitialLoading(false);
        if (isManualRefresh) setRefreshing(false);
      }
    },
    [showError, showSuccess],
  );

  const fetchCleaners = useCallback(async () => {
    try {
      const res = await fetch("/api/cleaners");
      if (!res.ok) throw new Error("Failed to fetch cleaners");
      const data = (await res.json()) as Cleaner[];
      setCleaners(data);
    } catch (error) {
      console.error("Fetch cleaners error:", error);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
    fetchCleaners();

    const interval = setInterval(() => fetchFeedbacks(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchFeedbacks, fetchCleaners]);

  function handleModalComplete() {
    setForwardTarget(null);
    setDoneTarget(null);
    setReplyTarget(null);
    fetchFeedbacks(false, true);
  }

  const clientOptions = getClientNameOptions(feedbacks);
  const clientParam = searchParams.get("client");
  const clientFilter = clientParam ? normalizeClientName(clientParam) : null;
  const clientFiltered = filterByClientName(feedbacks, clientFilter);
  const stats = getStats(clientFiltered);
  const filtered = filterFeedbacks(clientFiltered, filter);
  const activeClientLabel =
    clientOptions.find((option) => option.key === clientFilter)?.label ??
    clientParam?.trim() ??
    null;

  function updateClientFilter(clientKey: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (clientKey) {
      const label = clientOptions.find((option) => option.key === clientKey)?.label;
      if (label) params.set("client", label);
    } else {
      params.delete("client");
    }

    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

  return (
    <div className="min-h-screen bg-[#f0f5fa]">
      <header className="bg-blue-800 shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white ring-1 ring-white/20">
              K
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                KNK Palvelut Oy
              </h1>
              <p className="text-sm text-blue-200">Feedback tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/rankings"
              className="rounded-xl bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition-all hover:bg-white/20"
            >
              Rankings
            </Link>
            <button
              type="button"
              onClick={() => fetchFeedbacks(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition-all hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshIcon spinning={refreshing} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon="total"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <StatCard
            label="Open"
            value={stats.open}
            icon="open"
            active={filter === "open"}
            onClick={() => setFilter("open")}
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            icon="overdue"
            highlight={stats.overdue > 0}
            active={filter === "overdue"}
            onClick={() => setFilter("overdue")}
          />
          <StatCard
            label="Awaiting reply"
            value={stats.awaitingReply}
            icon="reply"
            active={filter === "done"}
            onClick={() => setFilter("done")}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Filter by location
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={clientFilter ?? ""}
              onChange={(e) => updateClientFilter(e.target.value || null)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All locations</option>
              {clientOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            {clientFilter && (
              <button
                type="button"
                onClick={() => updateClientFilter(null)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                Clear location
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Filter by status
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                  filter === option.value
                    ? "bg-blue-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4 sm:space-y-5">
          {clientFilter && activeClientLabel && (
            <p className="text-sm text-slate-500">
              Showing feedback for{" "}
              <span className="font-semibold text-slate-800">{activeClientLabel}</span>
            </p>
          )}
          {initialLoading ? (
            <FeedbackSkeleton />
          ) : filtered.length === 0 ? (
            clientFilter ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                  No cases for this location with the current filters.
                </p>
              </div>
            ) : (
              <EmptyState filter={filter} />
            )
          ) : (
            filtered.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onForward={setForwardTarget}
                onDone={setDoneTarget}
                onReply={setReplyTarget}
              />
            ))
          )}
        </div>
      </main>

      {forwardTarget && (
        <ForwardModal
          feedback={forwardTarget}
          cleaners={cleaners}
          onClose={() => setForwardTarget(null)}
          onConfirm={handleModalComplete}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}

      {doneTarget && (
        <DoneModal
          feedback={doneTarget}
          onClose={() => setDoneTarget(null)}
          onConfirm={handleModalComplete}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}

      {replyTarget && (
        <ReplyModal
          feedback={replyTarget}
          onClose={() => setReplyTarget(null)}
          onConfirm={handleModalComplete}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}
    </div>
  );
}

const STAT_ICON_STYLES = {
  total: "bg-blue-100 text-blue-700",
  open: "bg-sky-100 text-sky-700",
  overdue: "bg-red-100 text-red-700",
  reply: "bg-violet-100 text-violet-700",
} as const;

function StatCard({
  label,
  value,
  icon,
  highlight = false,
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  icon: keyof typeof STAT_ICON_STYLES;
  highlight?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className={`mb-3 inline-flex rounded-lg p-2 ${STAT_ICON_STYLES[icon]}`}>
        <StatIcon type={icon} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-0.5 text-3xl font-bold tracking-tight ${
          highlight ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md sm:p-5 ${
        active
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      {content}
    </button>
  );
}

function StatIcon({ type }: { type: keyof typeof STAT_ICON_STYLES }) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "total":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "open":
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "overdue":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "reply":
      return (
        <svg {...props}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
  }
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
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
      className={spinning ? "animate-spin" : ""}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
