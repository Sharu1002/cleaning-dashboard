"use client";

import { useEffect, useState } from "react";
import type { Cleaner, Feedback } from "@/types";
import { formatPhoneForWhatsApp } from "@/lib/feedback-utils";

type ForwardModalProps = {
  feedback: Feedback;
  cleaners: Cleaner[];
  onClose: () => void;
  onConfirm: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function ForwardModal({
  feedback,
  cleaners,
  onClose,
  onConfirm,
  onSuccess,
  onError,
}: ForwardModalProps) {
  const [selectedCleanerId, setSelectedCleanerId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedCleaner = cleaners.find((c) => c.id === selectedCleanerId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  useEffect(() => {
    if (!selectedCleaner) return;

    const confirmUrl = `${appUrl}/api/confirm/${feedback.confirmation_token}`;
    setMessage(
      `Hi ${selectedCleaner.name}, action needed at ${feedback.client_name}: ${feedback.summary ?? ""}. Please tap this link when done: ${confirmUrl}`,
    );
  }, [selectedCleaner, feedback, appUrl]);

  async function handleConfirm() {
    if (!selectedCleaner) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/feedbacks/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "forwarded",
          assigned_cleaner: selectedCleaner.name,
          assigned_cleaner_phone: selectedCleaner.phone,
          forwarded_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update feedback");
      onSuccess(`Forwarded to ${selectedCleaner.name}.`);
      onConfirm();
    } catch (error) {
      console.error("Forward error:", error);
      onError("Something went wrong, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenWhatsApp() {
    if (!selectedCleaner) return;
    const phone = formatPhoneForWhatsApp(selectedCleaner.phone);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <ModalShell title="Forward to cleaner" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{feedback.client_name}</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">{feedback.summary}</p>
          <p className="mt-2 text-sm text-gray-600">{feedback.full_feedback}</p>
        </div>

        <div>
          <label htmlFor="cleaner" className="mb-1 block text-sm font-medium text-gray-700">
            Select cleaner
          </label>
          <select
            id="cleaner"
            value={selectedCleanerId}
            onChange={(e) => setSelectedCleanerId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Choose a cleaner…</option>
            {cleaners.map((cleaner) => (
              <option key={cleaner.id} value={cleaner.id}>
                {cleaner.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="whatsapp-message" className="mb-1 block text-sm font-medium text-gray-700">
            WhatsApp message
          </label>
          <textarea
            id="whatsapp-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            disabled={!selectedCleaner}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={!selectedCleaner || !message}
            className="rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open WhatsApp
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedCleaner || submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Confirm forward"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

type DoneModalProps = {
  feedback: Feedback;
  onClose: () => void;
  onConfirm: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function DoneModal({
  feedback,
  onClose,
  onConfirm,
  onSuccess,
  onError,
}: DoneModalProps) {
  const [internalNote, setInternalNote] = useState(feedback.internal_note ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/feedbacks/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "done",
          done_at: new Date().toISOString(),
          internal_note: internalNote || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update feedback");
      onSuccess("Task marked done");
      onConfirm();
    } catch (error) {
      console.error("Done error:", error);
      onError("Something went wrong, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title="Mark as done" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            Client: <span className="font-medium text-gray-900">{feedback.client_name}</span>
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Cleaner:{" "}
            <span className="font-medium text-gray-900">
              {feedback.assigned_cleaner ?? "Unassigned"}
            </span>
          </p>
        </div>

        <div>
          <label htmlFor="internal-note" className="mb-1 block text-sm font-medium text-gray-700">
            Internal note (optional)
          </label>
          <textarea
            id="internal-note"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            rows={4}
            placeholder="Add any internal notes…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Confirm done"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

type ReplyModalProps = {
  feedback: Feedback;
  onClose: () => void;
  onConfirm: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

const DEFAULT_REPLY = (clientName: string) =>
  `Hi ${clientName}, thank you for your feedback. We wanted to let you know that our team has addressed the issue and it has been resolved. We appreciate you taking the time to let us know — it helps us keep our standards high. Please don't hesitate to reach out if anything else comes up. Warm regards, Sparkling Clean Co.`;

export function ReplyModal({
  feedback,
  onClose,
  onConfirm,
  onSuccess,
  onError,
}: ReplyModalProps) {
  const [emailBody, setEmailBody] = useState(DEFAULT_REPLY(feedback.client_name));
  const [submitting, setSubmitting] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(emailBody);
      onSuccess("Email copied");
    } catch (error) {
      console.error("Copy error:", error);
      onError("Something went wrong, please try again");
    }
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/feedbacks/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "replied",
          replied_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update feedback");
      onConfirm();
    } catch (error) {
      console.error("Reply error:", error);
      onError("Something went wrong, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title="Reply to customer" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          To:{" "}
          <span className="font-medium text-gray-900">
            {feedback.client_email ?? "No email on file"}
          </span>
        </p>

        <div>
          <label htmlFor="email-body" className="mb-1 block text-sm font-medium text-gray-700">
            Email message
          </label>
          <textarea
            id="email-body"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Copy email
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Mark as replied"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
