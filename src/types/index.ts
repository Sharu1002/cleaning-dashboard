export type Urgency = "low" | "medium" | "high";

export type Status = "new" | "forwarded" | "done" | "replied";

export type Feedback = {
  id: string;
  client_name: string;
  client_email: string | null;
  full_feedback: string;
  summary: string | null;
  urgency: Urgency;
  status: Status;
  assigned_cleaner: string | null;
  assigned_cleaner_phone: string | null;
  created_at: string;
  forwarded_at: string | null;
  done_at: string | null;
  replied_at: string | null;
  internal_note: string | null;
  confirmation_token: string | null;
};

export type Cleaner = {
  id: string;
  name: string;
  phone: string;
};
