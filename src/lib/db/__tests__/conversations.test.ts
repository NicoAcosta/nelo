import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UIMessage } from "ai";

// Mock the Supabase server client before importing anything that uses it
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle, eq: mockEq2 }));
const mockEq2 = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockUpdateEq = vi.fn(() => ({ eq: mockUpdateEq2 }));
const mockUpdateEq2 = vi.fn(() => Promise.resolve({ error: null }));

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}));

import {
  saveConversation,
  loadConversation,
  stripBase64Attachments,
  getTextFromMessage,
} from "../conversations";

// Helper to build a simple user UIMessage
function makeUserMessage(text: string, id = "msg-1"): UIMessage {
  return {
    id,
    role: "user",
    parts: [{ type: "text", text }],
    content: text,
  };
}

function makeAssistantMessage(text: string, id = "msg-2"): UIMessage {
  return {
    id,
    role: "assistant",
    parts: [{ type: "text", text }],
    content: text,
  };
}

describe("saveConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock chain setup
    mockFrom.mockImplementation((table: string) => {
      if (table === "conversations") {
        return {
          select: mockSelect,
          upsert: mockUpsert,
        };
      }
      if (table === "projects") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return { select: mockSelect };
    });
    // Default project select returns a project row
    mockSingle.mockResolvedValue({ data: { id: "proj-123" }, error: null });
    // Default update chain
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockUpdateEq.mockReturnValue({ eq: mockUpdateEq2 });
    mockUpdateEq2.mockResolvedValue({ error: null });
  });

  it("calls supabase upsert with correct project_id and sanitized messages", async () => {
    const messages: UIMessage[] = [makeUserMessage("Hello"), makeAssistantMessage("Hi there")];

    await saveConversation("proj-123", "user-456", messages);

    expect(mockFrom).toHaveBeenCalledWith("conversations");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: "proj-123",
        messages: expect.any(Array),
      }),
      { onConflict: "project_id" }
    );
  });

  it("strips base64 data URLs from experimental_attachments before save", async () => {
    const messages: UIMessage[] = [
      {
        ...makeUserMessage("Here is my floor plan"),
        experimental_attachments: [
          { name: "plan.png", url: "data:image/png;base64,abc123", contentType: "image/png" },
        ],
      },
    ];

    await saveConversation("proj-123", "user-456", messages);

    const upsertCall = mockUpsert.mock.calls[0][0];
    const storedMessages = upsertCall.messages as UIMessage[];
    expect(storedMessages[0].experimental_attachments![0].url).toBe("[image-stripped]");
  });

  it("updates project title from first user message when title is 'New Project'", async () => {
    const messages: UIMessage[] = [makeUserMessage("Build me a house")];

    await saveConversation("proj-123", "user-456", messages);

    expect(mockFrom).toHaveBeenCalledWith("projects");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Build me a house" })
    );
    // Should only update if current title is 'New Project'
    expect(mockUpdateEq2).toHaveBeenCalledWith("title", "New Project");
  });
});

describe("loadConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockUpdateEq.mockReturnValue({ eq: mockUpdateEq2 });
    mockUpdateEq2.mockResolvedValue({ error: null });
  });

  it("returns messages array from an existing conversation row", async () => {
    const storedMessages: UIMessage[] = [makeUserMessage("Tell me about costs")];
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "projects") {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: "proj-123" }, error: null }) })) })) };
      }
      if (table === "conversations") {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { messages: storedMessages }, error: null }) })) })) };
      }
      return { select: mockSelect };
    });

    const result = await loadConversation("proj-123", "user-456");

    expect(result).toEqual(storedMessages);
  });

  it("returns [] when project exists but no conversation row", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "projects") {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: "proj-123" }, error: null }) })) })) };
      }
      if (table === "conversations") {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })) })) };
      }
      return { select: mockSelect };
    });

    const result = await loadConversation("proj-123", "user-456");

    expect(result).toEqual([]);
  });

  it("returns null when project does not exist (RLS blocks or no row)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "projects") {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })) })) };
      }
      return { select: mockSelect };
    });

    const result = await loadConversation("nonexistent-proj", "user-456");

    expect(result).toBeNull();
  });
});

describe("stripBase64Attachments", () => {
  it("returns messages without attachments unchanged", () => {
    const messages: UIMessage[] = [makeUserMessage("Hello"), makeAssistantMessage("Hi")];
    const result = stripBase64Attachments(messages);
    expect(result).toEqual(messages);
  });

  it("preserves non-base64 attachment URLs unchanged", () => {
    const messages: UIMessage[] = [
      {
        ...makeUserMessage("Check this image"),
        experimental_attachments: [
          { name: "img.png", url: "https://example.com/img.png", contentType: "image/png" },
        ],
      },
    ];
    const result = stripBase64Attachments(messages);
    expect(result[0].experimental_attachments![0].url).toBe("https://example.com/img.png");
  });

  it("replaces base64 data: URLs with [image-stripped]", () => {
    const messages: UIMessage[] = [
      {
        ...makeUserMessage("Floor plan"),
        experimental_attachments: [
          { name: "plan.jpg", url: "data:image/jpeg;base64,/9j/4AAQ...", contentType: "image/jpeg" },
        ],
      },
    ];
    const result = stripBase64Attachments(messages);
    expect(result[0].experimental_attachments![0].url).toBe("[image-stripped]");
  });
});

describe("listProjects", () => {
  const mockOrder = vi.fn();
  const mockListSelect = vi.fn(() => ({ order: mockOrder }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => {
      if (table === "projects") {
        return { select: mockListSelect };
      }
      return { select: mockSelect };
    });
  });

  it("calls supabase with correct query and returns data array", async () => {
    const projects = [
      { id: "p1", title: "House", created_at: "2024-01-01", updated_at: "2024-01-02" },
    ];
    mockOrder.mockResolvedValue({ data: projects, error: null });

    const { listProjects } = await import("../conversations");
    const result = await listProjects();

    expect(mockFrom).toHaveBeenCalledWith("projects");
    expect(mockListSelect).toHaveBeenCalledWith("id, title, created_at, updated_at");
    expect(mockOrder).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(result).toEqual(projects);
  });

  it("returns [] when supabase returns null data", async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const { listProjects } = await import("../conversations");
    const result = await listProjects();

    expect(result).toEqual([]);
  });

  it("throws Error when supabase returns an error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { listProjects } = await import("../conversations");
    await expect(listProjects()).rejects.toThrow("listProjects failed: DB error");
  });
});

describe("getTextFromMessage", () => {
  it("extracts text from a message with text parts", () => {
    const msg = makeUserMessage("Hello world");
    expect(getTextFromMessage(msg)).toBe("Hello world");
  });

  it("joins multiple text parts", () => {
    const msg: UIMessage = {
      id: "msg-1",
      role: "user",
      parts: [
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
      ],
      content: "Hello world",
    };
    expect(getTextFromMessage(msg)).toBe("Hello world");
  });

  it("returns empty string for messages with no text parts", () => {
    const msg: UIMessage = {
      id: "msg-1",
      role: "assistant",
      parts: [],
      content: "",
    };
    expect(getTextFromMessage(msg)).toBe("");
  });
});
