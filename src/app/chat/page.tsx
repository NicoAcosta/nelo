import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/chat");

  const id = crypto.randomUUID();
  await supabase.from("projects").insert({
    id,
    user_id: user.id,
    title: "New Project",
  });

  const params = await searchParams;
  const q = params.q;
  redirect(q ? `/chat/${id}?q=${encodeURIComponent(q)}` : `/chat/${id}`);
}
