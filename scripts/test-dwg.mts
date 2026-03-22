import { processDocument } from "../src/lib/documents/processor.ts";
import { readFileSync } from "fs";

const buffer = readFileSync("/tmp/test-sample.dwg");
console.log("Processing DWG (" + buffer.length + " bytes)...");

try {
  const result = await processDocument(buffer.buffer, "test-sample.dwg");
  console.log("\n=== Result ===");
  console.log("metadata:", JSON.stringify(result.metadata, null, 2));
  console.log("structuredData:", JSON.stringify(result.structuredData, null, 2));
  console.log(
    "renderedImage:",
    result.renderedImage
      ? "present (" + result.renderedImage.length + " chars)"
      : "null",
  );
  console.log("\n=== PASS ===");
} catch (e: any) {
  console.error("\n=== FAIL ===");
  console.error("Error:", e.message);
}
