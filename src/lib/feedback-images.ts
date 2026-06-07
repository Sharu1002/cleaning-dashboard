import { supabase } from "@/lib/supabase-server";

const BUCKET = "feedback-images";

type PostmarkAttachment = {
  Name: string;
  Content: string;
  ContentType: string;
  ContentLength: number;
};

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return base.slice(0, 200) || "image";
}

export async function uploadFeedbackImageAttachments(
  attachments: PostmarkAttachment[] | undefined,
): Promise<string[]> {
  if (!attachments?.length) return [];

  const imageAttachments = attachments.filter((a) =>
    a.ContentType?.toLowerCase().startsWith("image/"),
  );

  const urls: string[] = [];

  for (const attachment of imageAttachments) {
    const fileName = `${crypto.randomUUID()}-${sanitizeFilename(attachment.Name)}`;
    const buffer = Buffer.from(attachment.Content, "base64");

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, buffer, {
      contentType: attachment.ContentType,
      upsert: false,
    });

    if (error) {
      console.error("Failed to upload feedback image:", attachment.Name, error);
      continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    urls.push(data.publicUrl);
  }

  return urls;
}
