import type { Feedback } from "@/types";

export function getFeedbackChangeNotifications(
  previous: Feedback[],
  current: Feedback[],
): string[] {
  const messages: string[] = [];
  const prevMap = new Map(previous.map((f) => [f.id, f]));

  for (const feedback of current) {
    const prev = prevMap.get(feedback.id);

    if (!prev) {
      messages.push(`New feedback from ${feedback.client_name}`);
      continue;
    }

    if (prev.status === feedback.status) continue;

    if (prev.status === "forwarded" && feedback.status === "done") {
      messages.push(
        `${feedback.assigned_cleaner ?? "Cleaner"} confirmed task for ${feedback.client_name}`,
      );
    }
  }

  return messages;
}
