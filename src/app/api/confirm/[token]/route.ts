import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import type { Feedback } from "@/types";

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Feedback Tracker</title>
</head>
<body style="margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#1a1a1a;display:flex;align-items:center;justify-content:center;min-height:100vh;box-sizing:border-box;">
  <div style="max-width:480px;text-align:center;">
    ${body}
    <p style="margin:32px 0 0;font-size:14px;color:#888;">Feedback Tracker</p>
  </div>
</body>
</html>`;
}

function notFoundPage() {
  return htmlPage(
    "Link Not Found",
    `<p style="margin:0;font-size:18px;line-height:1.6;color:#555;">Link not found or already used.</p>`,
  );
}

function alreadyConfirmedPage() {
  return htmlPage(
    "Already Confirmed",
    `<p style="margin:0;font-size:18px;line-height:1.6;color:#555;">This task was already confirmed. Thank you!</p>`,
  );
}

function successPage(cleanerName: string) {
  return htmlPage(
    "Task Confirmed",
    `<div style="font-size:48px;color:#22c55e;margin-bottom:16px;">✓</div>
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:600;">Task confirmed!</h1>
    <p style="margin:0;font-size:18px;line-height:1.6;color:#444;">Thank you, ${cleanerName}. The team has been notified.</p>`,
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const { data, error } = await supabase
      .from("feedbacks")
      .select("id, status, assigned_cleaner")
      .eq("confirmation_token", token)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return new NextResponse(notFoundPage(), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const feedback = data as Pick<
      Feedback,
      "id" | "status" | "assigned_cleaner"
    >;

    if (feedback.status !== "forwarded") {
      return new NextResponse(alreadyConfirmedPage(), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const { error: updateError } = await supabase
      .from("feedbacks")
      .update({
        status: "done",
        done_at: new Date().toISOString(),
      })
      .eq("id", feedback.id);

    if (updateError) {
      throw updateError;
    }

    const cleanerName = feedback.assigned_cleaner ?? "there";

    return new NextResponse(successPage(cleanerName), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Confirmation link error:", error);
    return new NextResponse(
      htmlPage(
        "Error",
        `<p style="margin:0;font-size:18px;line-height:1.6;color:#555;">Something went wrong. Please try again later.</p>`,
      ),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}
