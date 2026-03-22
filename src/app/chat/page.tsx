import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; files?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/chat");

  const id = crypto.randomUUID();
  const { error } = await supabase.from("projects").insert({
    id,
    user_id: user.id,
    title: "New Project",
  });
  if (error) {
    console.error("Failed to create project:", error);
    throw new Error(`Failed to create project: ${error.message}`);
  }

  const params = await searchParams;
  const q = params.q?.slice(0, 500); // Prevent excessively long redirect URLs
  const hasPendingFiles = params.files === "pending";
  const qs = [
    q ? `q=${encodeURIComponent(q)}` : null,
    hasPendingFiles ? "files=pending" : null,
  ]
    .filter(Boolean)
    .join("&");
  redirect(qs ? `/chat/${id}?${qs}` : `/chat/${id}`);
}
