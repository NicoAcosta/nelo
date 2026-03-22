import type { ModelMessage } from "ai";

const DATA_URL_RE = /^data:([^;]+);base64,(.+)$/;

/**
 * Fix data: URL file parts produced by convertToModelMessages.
 *
 * convertToModelMessages sets `data: part.url` on FilePart objects, which
 * passes the full "data:mime;base64,..." string. The AI SDK provider then
 * treats it as a downloadable URL and rejects it because validateDownloadUrl
 * only allows http/https schemes.
 *
 * This strips the data-URL prefix so `data` contains raw base64 and sets
 * `mediaType` explicitly from the MIME in the URL.
 *
 * TODO: Remove when the AI SDK handles data: URLs natively in
 * convertToModelMessages (https://github.com/vercel/ai/issues — file upstream)
 */
export function fixDataUrlFileParts(modelMessages: ModelMessage[]): void {
  for (const msg of modelMessages) {
    if (msg.role !== "user" || !Array.isArray(msg.content)) continue;
    for (const part of msg.content) {
      if (part.type !== "file" || typeof part.data !== "string") continue;
      const match = DATA_URL_RE.exec(part.data);
      if (match && match[1]) {
        part.mediaType = match[1];
        part.data = match[2];
        console.debug(
          "[fixDataUrlFileParts] Converted data: URL to inline base64",
          { mediaType: match[1], base64Length: match[2].length },
        );
      }
    }
  }
}
