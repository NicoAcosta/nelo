import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadConversation } from "@/lib/db/conversations";
import { ChatContent } from "./chat-content";
import { IconNelo } from "@/components/icons";
import type { UIMessage } from "ai";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=/chat/${id}`);

  const messages: UIMessage[] | null = await loadConversation(id, user.id);
  if (messages === null) notFound();

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <IconNelo className="w-10 h-10 text-on-surface animate-pulse" />
        </div>
      }
    >
      <ChatContent id={id} initialMessages={messages} />
    </Suspense>
  );
}
