"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FeedbackSkeleton } from "@/components/FeedbackSkeleton";
import { DoneModal, ForwardModal, ReplyModal } from "@/components/FeedbackModals";
import { ToastProvider, useToast } from "@/components/Toast";
import {
  FILTER_OPTIONS,
  type Filter,
  filterFeedbacks,
  getStats,
} from "@/lib/feedback-utils";
import type { Cleaner, Feedback } from "@/types";

const REFRESH_INTERVAL_MS = 30_000;

export default function Home() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}

function Dashboard() {
  const { showSuccess, showError } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<Feedback | null>(null);
  const [doneTarget, setDoneTarget] = useState<Feedback | null>(null);
  const [replyTarget, setReplyTarget] = useState<Feedback | null>(null);

  const fetchFeedbacks = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/feedbacks");
      if (!res.ok) throw new Error("Failed to fetch feedbacks");
      const data = (await res.json()) as Feedback[];
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
  }, [showError]);

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
    fetchFeedbacks();
  }

  const stats = getStats(feedbacks);
  const filtered = filterFeedbacks(feedbacks, filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-4 py-6 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback tracker</h1>
            <p className="mt-1 text-sm text-gray-500">Sparkling Clean Co.</p>
          </div>
          <button
            type="button"
            onClick={() => fetchFeedbacks(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshIcon spinning={refreshing} />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Open" value={stats.open} />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            highlight={stats.overdue > 0}
            active={filter === "overdue"}
            onClick={() => setFilter("overdue")}
          />
          <StatCard
            label="Awaiting reply"
            value={stats.awaitingReply}
            active={filter === "done"}
            onClick={() => setFilter("done")}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === option.value
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {initialLoading ? (
            <FeedbackSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState filter={filter} />
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

function StatCard({
  label,
  value,
  highlight = false,
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const clickable = !!onClick;

  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-xl border bg-white p-4 text-left transition-colors hover:border-gray-400 ${
          active ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {content}
    </div>
  );
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
