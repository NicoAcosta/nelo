import { NextResponse } from "next/server";
import { processDocument } from "@/lib/documents/processor";
import { validateFile, MAX_FILES_PER_MESSAGE } from "@/lib/documents/validation";
import { createClient } from "@/lib/supabase/server";
import { buildStoragePath } from "@/lib/db/conversations";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Auth guard — must have a valid user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const projectId = formData.get("projectId") as string | null;

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_MESSAGE) {
      return NextResponse.json(
        { error: `Too many files (max ${MAX_FILES_PER_MESSAGE})` },
        { status: 400 },
      );
    }

    // Validate all files first
    for (const file of files) {
      const validation = validateFile(file.name, file.size);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error, fileName: file.name },
          { status: 400 },
        );
      }
    }

    // Process all files
    const results = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return processDocument(buffer, file.name);
      }),
    );

    // Upload rendered images to Supabase Storage (non-fatal: failure falls back to base64)
    const resultsWithStorage = await Promise.all(
      results.map(async (result, i) => {
        if (!result.renderedImage || !projectId || !user.id) return result;
        try {
          const file = files[i];
          const storagePath = buildStoragePath(user.id, projectId, file.name);
          const buffer = await file.arrayBuffer();
          const { error: uploadError } = await supabase.storage
            .from("floor-plans")
            .upload(storagePath, buffer, {
              contentType: file.type || "application/octet-stream",
              upsert: false,
            });
          if (uploadError) {
            console.error("Storage upload failed:", uploadError.message);
            return result;
          }
          return { ...result, storagePath };
        } catch (err) {
          console.error("Storage upload error:", err);
          return result;
        }
      }),
    );

    return NextResponse.json({ results: resultsWithStorage });
  } catch (error) {
    console.error("Document processing error:", error);
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json(
      { error: "Document processing failed", detail: message },
      { status: 500 },
    );
  }
}
