"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateProjectTitle(
  projectId: string,
  newTitle: string,
): Promise<{ error?: string }> {
  if (!UUID_RE.test(projectId)) return { error: "Invalid project ID" };
  const trimmed = newTitle.trim();
  if (!trimmed) return { error: "Title cannot be empty" };
  if (trimmed.length > 100) return { error: "Title too long" };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("projects")
    .update({ title: trimmed }, { count: "exact" })
    .eq("id", projectId);

  if (error) return { error: error.message };
  if (count === 0) return { error: "Project not found" };
  revalidatePath("/projects");
  return {};
}
