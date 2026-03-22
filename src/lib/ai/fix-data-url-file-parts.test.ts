import { describe, expect, it, vi } from "vitest";
import type { ModelMessage } from "ai";
import { fixDataUrlFileParts } from "./fix-data-url-file-parts";

function makeUserMsg(parts: ModelMessage["content"]): ModelMessage {
  return { role: "user" as const, content: parts } as ModelMessage;
}

describe("fixDataUrlFileParts", () => {
  it("converts a data: URL file part to raw base64 with mediaType", () => {
    const base64 = "iVBORw0KGgoAAAANSUhEUg==";
    const messages: ModelMessage[] = [
      makeUserMsg([
        { type: "file", data: `data:image/png;base64,${base64}`, mediaType: "" },
      ]),
    ];

    fixDataUrlFileParts(messages);

    const part = (messages[0].content as Array<{ type: string; data: unknown; mediaType: string }>)[0];
    expect(part.data).toBe(base64);
    expect(part.mediaType).toBe("image/png");
  });

  it("handles application/pdf media type", () => {
    const base64 = "JVBERi0xLjQK";
    const messages: ModelMessage[] = [
      makeUserMsg([
        { type: "file", data: `data:application/pdf;base64,${base64}`, mediaType: "" },
      ]),
    ];

    fixDataUrlFileParts(messages);

    const part = (messages[0].content as Array<{ type: string; data: unknown; mediaType: string }>)[0];
    expect(part.data).toBe(base64);
    expect(part.mediaType).toBe("application/pdf");
  });

  it("leaves non-data-URL file parts untouched", () => {
    const messages: ModelMessage[] = [
      makeUserMsg([
        { type: "file", data: "https://example.com/image.png", mediaType: "image/png" },
      ]),
    ];

    fixDataUrlFileParts(messages);

    const part = (messages[0].content as Array<{ type: string; data: unknown }>)[0];
    expect(part.data).toBe("https://example.com/image.png");
  });

  it("leaves text parts untouched", () => {
    const messages: ModelMessage[] = [
      makeUserMsg([{ type: "text", text: "hello" }]),
    ];

    fixDataUrlFileParts(messages);

    const part = (messages[0].content as Array<{ type: string; text: string }>)[0];
    expect(part.text).toBe("hello");
  });

  it("skips non-user messages", () => {
    const base64 = "abc123";
    const messages: ModelMessage[] = [
      {
        role: "assistant",
        content: [
          { type: "file", data: `data:image/png;base64,${base64}`, mediaType: "" },
        ],
      } as unknown as ModelMessage,
    ];

    fixDataUrlFileParts(messages);

    const part = (messages[0].content as Array<{ type: string; data: unknown }>)[0];
    expect(part.data).toBe(`data:image/png;base64,${base64}`);
  });

  it("skips file parts where data is not a string (e.g. Uint8Array)", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const messages: ModelMessage[] = [
      makeUserMsg([
        { type: "file", data: bytes, mediaType: "image/png" },
      ]),
    ];

    fixDataUrlFileParts(messages);

    const part = (messages[0].content as Array<{ type: string; data: unknown }>)[0];
    expect(part.data).toBe(bytes);
  });

  it("handles messages with no file parts (no-op)", () => {
    const messages: ModelMessage[] = [
      makeUserMsg([{ type: "text", text: "describe my project" }]),
    ];

    // Should not throw
    fixDataUrlFileParts(messages);
    expect((messages[0].content as Array<{ type: string }>)[0].type).toBe("text");
  });

  it("handles empty messages array", () => {
    const messages: ModelMessage[] = [];
    fixDataUrlFileParts(messages);
    expect(messages).toHaveLength(0);
  });

  it("skips malformed data URLs with empty mediaType", () => {
    const messages: ModelMessage[] = [
      makeUserMsg([
        { type: "file", data: "data:;base64,abc123", mediaType: "" },
      ]),
    ];

    fixDataUrlFileParts(messages);

    // The regex [^;]+ won't match empty string, so it should be untouched
    const part = (messages[0].content as Array<{ type: string; data: unknown }>)[0];
    expect(part.data).toBe("data:;base64,abc123");
  });

  it("logs debug output when converting", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const base64 = "iVBORw0KGgo=";
    const messages: ModelMessage[] = [
      makeUserMsg([
        { type: "file", data: `data:image/png;base64,${base64}`, mediaType: "" },
      ]),
    ];

    fixDataUrlFileParts(messages);

    expect(debugSpy).toHaveBeenCalledWith(
      "[fixDataUrlFileParts] Converted data: URL to inline base64",
      { mediaType: "image/png", base64Length: base64.length },
    );
    debugSpy.mockRestore();
  });
});
