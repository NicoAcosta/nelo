"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProjectTitle(
  projectId: string,
  newTitle: string,
): Promise<{ error?: string }> {
  const trimmed = newTitle.trim();
  if (!trimmed) return { error: "Title cannot be empty" };
  if (trimmed.length > 100) return { error: "Title too long" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ title: trimmed })
    .eq("id", projectId);

  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}
