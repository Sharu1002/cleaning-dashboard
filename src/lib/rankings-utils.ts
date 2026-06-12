import { daysSince, normalizeClientName } from "@/lib/feedback-utils";
import type { Feedback } from "@/types";

export type TimeRange = "30" | "90" | "all";
export type RiskLevel = "high" | "medium" | "low";

export type LocationRanking = {
  client_name: string;
  total_complaints: number;
  high_urgency_count: number;
  last_complaint_date: string;
  risk_level: RiskLevel;
};

export function filterByTimeRange(
  feedbacks: Feedback[],
  range: TimeRange,
): Feedback[] {
  if (range === "all") return feedbacks;

  const days = range === "30" ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return feedbacks.filter(
    (feedback) => new Date(feedback.created_at).getTime() >= cutoff,
  );
}

function calculateRiskLevel(
  totalComplaints: number,
  highUrgencyCount: number,
): RiskLevel {
  if (totalComplaints >= 6 || highUrgencyCount >= 3) return "high";
  if (totalComplaints >= 3) return "medium";
  return "low";
}

export function buildLocationRankings(feedbacks: Feedback[]): LocationRanking[] {
  const groups = new Map<string, Feedback[]>();

  for (const feedback of feedbacks) {
    const key = normalizeClientName(feedback.client_name);
    if (!key) continue;

    const existing = groups.get(key) ?? [];
    existing.push(feedback);
    groups.set(key, existing);
  }

  const rankings: LocationRanking[] = [];

  for (const group of groups.values()) {
    const sorted = [...group].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const totalComplaints = group.length;
    const highUrgencyCount = group.filter((f) => f.urgency === "high").length;

    rankings.push({
      client_name: sorted[0].client_name.trim(),
      total_complaints: totalComplaints,
      high_urgency_count: highUrgencyCount,
      last_complaint_date: sorted[0].created_at,
      risk_level: calculateRiskLevel(totalComplaints, highUrgencyCount),
    });
  }

  return rankings.sort((a, b) => b.total_complaints - a.total_complaints);
}

export function getRankingsSummary(rankings: LocationRanking[]) {
  const totalLocations = rankings.length;
  const needingAttention = rankings.filter(
    (r) => r.risk_level === "high" || r.risk_level === "medium",
  ).length;
  const totalComplaints = rankings.reduce((sum, r) => sum + r.total_complaints, 0);
  const averagePerLocation =
    totalLocations > 0 ? totalComplaints / totalLocations : 0;

  return {
    totalLocations,
    needingAttention,
    totalComplaints,
    averagePerLocation,
  };
}

export function formatDaysSinceComplaint(dateStr: string): string {
  const days = daysSince(dateStr);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export const RISK_BADGE: Record<RiskLevel, { label: string; className: string }> = {
  high: { label: "High risk", className: "bg-red-50 text-red-800 ring-1 ring-red-200/80" },
  medium: {
    label: "Medium risk",
    className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  },
  low: { label: "On track", className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80" },
};

export const RANK_COLOR: Record<RiskLevel, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-slate-400",
};

export const BAR_COLOR: Record<RiskLevel, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-300",
};
