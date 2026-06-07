import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import type { Urgency } from "@/types";

type PostmarkInboundEmail = {
  FromName: string;
  From: string;
  Subject: string;
  TextBody: string;
};

type ExtractedFeedback = {
  client_name: string;
  client_email: string;
  summary: string;
  full_feedback: string;
  urgency: Urgency;
};

const EXTRACTION_PROMPT = `You are an assistant for a cleaning company. This is a forwarded customer feedback email. Extract the original customer feedback — ignore the forwarding headers and focus on the actual customer message.

Return JSON only, no explanation:
{
  "client_name": "the original customer's name if visible, otherwise the sender name",
  "client_email": "the original customer's email if visible in the forwarded body, otherwise the From email",
  "summary": "one clear sentence describing the issue or feedback",
  "full_feedback": "the full original customer message, cleaned up",
  "urgency": "low, medium, or high — high if complaint or hygiene issue, medium if general feedback, low if compliment"
}`;

function parseClaudeJson(text: string): ExtractedFeedback {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as ExtractedFeedback;

  if (
    !parsed.client_name ||
    !parsed.client_email ||
    !parsed.summary ||
    !parsed.full_feedback ||
    !parsed.urgency
  ) {
    throw new Error("Claude response missing required fields");
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-postmark-token");
    const expectedToken = process.env.POSTMARK_WEBHOOK_TOKEN;

    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as PostmarkInboundEmail;
    const { FromName, From, Subject, TextBody } = body;

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}

Email details:
From Name: ${FromName ?? ""}
From Email: ${From ?? ""}
Subject: ${Subject ?? ""}
Body:
${TextBody ?? ""}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const extracted = parseClaudeJson(textBlock.text);
    const confirmationToken = crypto.randomUUID();

    const { error } = await supabase.from("feedbacks").insert({
      client_name: extracted.client_name,
      client_email: extracted.client_email,
      summary: extracted.summary,
      full_feedback: extracted.full_feedback,
      urgency: extracted.urgency,
      status: "new",
      confirmation_token: confirmationToken,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inbound email webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
