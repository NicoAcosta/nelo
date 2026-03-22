import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loadConversation,
  extractEstimateFromMessages,
} from "@/lib/db/conversations";
import { EstimateDashboard } from "./estimate-dashboard";

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const messages = await loadConversation(id, "");
  if (!messages) notFound();

  const estimateData = extractEstimateFromMessages(messages);
  if (!estimateData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#08080a] text-[#fafafa]">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No estimate found</p>
          <p className="text-sm text-[#71717a] mb-6">
            This conversation doesn&apos;t have a completed estimate yet.
          </p>
          <a
            href={`/chat/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ccff00] text-black font-semibold text-sm hover:brightness-95 transition-all"
          >
            ← Back to Chat
          </a>
        </div>
      </div>
    );
  }

  const projectName = project.title || "Construction Estimate";

  return (
    <EstimateDashboard
      estimate={estimateData.estimate}
      inputs={estimateData.inputs}
      projectName={projectName}
      chatId={id}
    />
  );
}
