import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loadConversation,
  extractEstimateFromMessages,
} from "@/lib/db/conversations";
import { EstimateDashboard } from "./estimate-dashboard";
import { NoEstimateFallback } from "./no-estimate-fallback";
import type { Estimate } from "@/lib/estimate/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", id)
    .single();
  return { title: `${project?.title || "Estimate"} — Nelo` };
}

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, messages] = await Promise.all([
    supabase.from("projects").select("id, title").eq("id", id).single(),
    loadConversation(id, ""),
  ]);

  if (!project) notFound();
  if (!messages) notFound();

  const estimateData = extractEstimateFromMessages(messages);
  if (!estimateData) {
    return <NoEstimateFallback chatId={id} />;
  }

  const projectName = project.title || "Construction Estimate";

  const persistedId = (estimateData.estimate as Estimate & { _persistedId?: string })._persistedId;

  return (
    <EstimateDashboard
      estimate={estimateData.estimate}
      inputs={estimateData.inputs}
      projectName={projectName}
      chatId={id}
      estimateId={persistedId}
    />
  );
}
