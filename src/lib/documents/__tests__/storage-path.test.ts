import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock nanoid — deterministic value for buildStoragePath
// ---------------------------------------------------------------------------
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "storageid1234"),
}));

// ---------------------------------------------------------------------------
// Mock Supabase server client for injectSignedUrls
// ---------------------------------------------------------------------------
const mockCreateSignedUrl = vi.fn();
const mockStorageFrom = vi.fn(() => ({
  createSignedUrl: mockCreateSignedUrl,
}));

const mockSupabase = {
  storage: {
    from: mockStorageFrom,
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import { buildStoragePath, injectSignedUrls } from "@/lib/db/conversations";
import { stripBase64Attachments } from "@/lib/db/conversations";
import type { FloorPlanRefMetadata } from "@/lib/db/conversations";
import type { UIMessage } from "ai";

// Helper to build UIMessage with extended runtime fields (experimental_attachments, metadata)
type TestMsg = UIMessage & {
  experimental_attachments?: Array<{ name?: string; url: string; contentType?: string }>;
  metadata?: FloorPlanRefMetadata;
  content?: string;
};

// ---------------------------------------------------------------------------
// buildStoragePath
// ---------------------------------------------------------------------------

describe("buildStoragePath", () => {
  it("returns floor-plans/{userId}/{projectId}/{nanoid}.{ext} format", () => {
    const path = buildStoragePath("user-1", "proj-1", "plan.pdf");
    expect(path).toBe("floor-plans/user-1/proj-1/storageid1234.pdf");
  });

  it("produces lowercase extension for .PNG input", () => {
    const path = buildStoragePath("user-1", "proj-1", "plan.PNG");
    expect(path).toBe("floor-plans/user-1/proj-1/storageid1234.png");
  });

  it("produces .dwg extension for DWG files", () => {
    const path = buildStoragePath("user-1", "proj-1", "file.dwg");
    expect(path).toBe("floor-plans/user-1/proj-1/storageid1234.dwg");
  });
});

// ---------------------------------------------------------------------------
// injectSignedUrls
// ---------------------------------------------------------------------------

describe("injectSignedUrls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces [image-stripped] URLs with signed URLs when annotation has storagePath", async () => {
    const messages: TestMsg[] = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "see attached" }],
        metadata: {
          floorPlanRefs: [
            {
              name: "plan.png",
              storagePath: "floor-plans/user-1/proj-1/storageid1234.png",
            },
          ],
        },
        experimental_attachments: [
          {
            name: "plan.png",
            url: "[image-stripped]",
            contentType: "image/png",
          },
        ],
      },
    ];

    mockCreateSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://supabase.co/storage/v1/signed/plan.png?token=abc" },
      error: null,
    });

    const result = await injectSignedUrls(messages, mockSupabase as never);

    expect((result[0] as TestMsg).experimental_attachments![0].url).toBe(
      "https://supabase.co/storage/v1/signed/plan.png?token=abc",
    );
    expect(mockStorageFrom).toHaveBeenCalledWith("floor-plans");
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(
      "floor-plans/user-1/proj-1/storageid1234.png",
      3600,
    );
  });

  it("leaves messages without floor-plan-ref metadata unchanged", async () => {
    const messages: TestMsg[] = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "hello" }],
      },
    ];

    const result = await injectSignedUrls(messages as UIMessage[], mockSupabase as never);

    expect(result).toEqual(messages);
    expect(mockCreateSignedUrl).not.toHaveBeenCalled();
  });

  it("leaves messages with non-stripped URLs unchanged", async () => {
    const messages: TestMsg[] = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "see attached" }],
        metadata: {
          floorPlanRefs: [
            {
              name: "plan.png",
              storagePath: "floor-plans/user-1/proj-1/storageid1234.png",
            },
          ],
        },
        experimental_attachments: [
          {
            name: "plan.png",
            url: "https://already-signed-url.com/plan.png",
            contentType: "image/png",
          },
        ],
      },
    ];

    mockCreateSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://new-signed-url.com/plan.png?token=abc" },
      error: null,
    });

    const result = await injectSignedUrls(messages as UIMessage[], mockSupabase as never);

    // URL was not [image-stripped], so it should NOT be replaced
    expect((result[0] as TestMsg).experimental_attachments![0].url).toBe(
      "https://already-signed-url.com/plan.png",
    );
  });
});

// ---------------------------------------------------------------------------
// stripBase64Attachments — regression test (existing behavior preserved)
// ---------------------------------------------------------------------------

describe("stripBase64Attachments", () => {
  it("strips data: URLs and replaces with [image-stripped]", () => {
    const messages: TestMsg[] = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "see plan" }],
        experimental_attachments: [
          {
            name: "plan.png",
            url: "data:image/png;base64,iVBORw0KGgo=",
            contentType: "image/png",
          },
        ],
      },
    ];

    const result = stripBase64Attachments(messages as UIMessage[]);
    expect((result[0] as TestMsg).experimental_attachments![0].url).toBe("[image-stripped]");
  });

  it("preserves non-data: URLs", () => {
    const messages: TestMsg[] = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "see plan" }],
        experimental_attachments: [
          {
            name: "plan.png",
            url: "https://example.com/plan.png",
            contentType: "image/png",
          },
        ],
      },
    ];

    const result = stripBase64Attachments(messages as UIMessage[]);
    expect((result[0] as TestMsg).experimental_attachments![0].url).toBe(
      "https://example.com/plan.png",
    );
  });

  it("returns messages unchanged if no experimental_attachments", () => {
    const messages: TestMsg[] = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "hello" }],
      },
    ];

    const result = stripBase64Attachments(messages as UIMessage[]);
    expect(result).toEqual(messages);
  });
});
