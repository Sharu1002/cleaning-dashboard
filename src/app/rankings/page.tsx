"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BAR_COLOR,
  RANK_COLOR,
  RISK_BADGE,
  type TimeRange,
  buildLocationRankings,
  filterByTimeRange,
  formatDaysSinceComplaint,
  getRankingsSummary,
} from "@/lib/rankings-utils";
import type { Feedback } from "@/types";

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export default function RankingsPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedbacks() {
      try {
        const res = await fetch("/api/feedbacks");
        if (!res.ok) throw new Error("Failed to fetch feedbacks");
        const data = (await res.json()) as Feedback[];
        setFeedbacks(data);
      } catch (error) {
        console.error("Fetch feedbacks error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeedbacks();
  }, []);

  const filtered = useMemo(
    () => filterByTimeRange(feedbacks, timeRange),
    [feedbacks, timeRange],
  );

  const rankings = useMemo(() => buildLocationRankings(filtered), [filtered]);
  const summary = useMemo(() => getRankingsSummary(rankings), [rankings]);
  const maxComplaints = rankings[0]?.total_complaints ?? 1;

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
              <p className="text-sm text-blue-200">Location rankings</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition-all hover:bg-white/20"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Negative feedback by location</h2>
            <p className="mt-1 text-sm text-slate-500">
              Locations ranked by complaint volume and urgency
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <MetricCard label="Total locations" value={summary.totalLocations} />
          <MetricCard
            label="Need attention"
            value={summary.needingAttention}
            highlight={summary.needingAttention > 0}
          />
          <MetricCard label="Total complaints" value={summary.totalComplaints} />
          <MetricCard
            label="Avg per location"
            value={summary.averagePerLocation.toFixed(1)}
          />
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <LoadingSkeleton />
          ) : rankings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-sm text-slate-500">No feedback for this time period.</p>
            </div>
          ) : (
            rankings.map((location, index) => {
              const badge = RISK_BADGE[location.risk_level];
              const barWidth = (location.total_complaints / maxComplaints) * 100;

              return (
                <article
                  key={location.client_name}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-wrap items-start gap-3 sm:gap-4">
                    <span
                      className={`w-8 shrink-0 text-2xl font-bold tabular-nums ${RANK_COLOR[location.risk_level]}`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/?client=${encodeURIComponent(location.client_name)}`}
                          className="text-base font-semibold text-slate-900 hover:text-blue-700 hover:underline"
                        >
                          {location.client_name}
                        </Link>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {location.total_complaints} complaint
                        {location.total_complaints !== 1 ? "s" : ""}
                        {location.high_urgency_count > 0 && (
                          <span className="text-red-600">
                            {" "}
                            · {location.high_urgency_count} high urgency
                          </span>
                        )}
                      </p>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${BAR_COLOR[location.risk_level]}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Last complaint: {formatDaysSinceComplaint(location.last_complaint_date)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-3xl font-bold tracking-tight ${
          highlight ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
        >
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-3 h-2 w-full rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
