import { NextResponse } from "next/server";
import { processDocument } from "@/lib/documents/processor";
import { validateFile, MAX_FILES_PER_MESSAGE } from "@/lib/documents/validation";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

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

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Document processing error:", error);
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json(
      { error: "Document processing failed", detail: message },
      { status: 500 },
    );
  }
}
