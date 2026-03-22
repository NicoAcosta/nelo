import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @supabase/ssr before importing modules under test
const mockBrowserClient = { auth: { getUser: vi.fn() } };
const mockServerClient = { auth: { getUser: vi.fn() } };

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => mockBrowserClient),
  createServerClient: vi.fn(() => mockServerClient),
}));

// Mock next/headers for server client
const mockCookieStore = {
  getAll: vi.fn(() => [{ name: "sb-token", value: "test-value" }]),
  set: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

describe("src/lib/supabase/client.ts — browser client factory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns an object with auth property", async () => {
    const { createClient } = await import("../client");
    const client = createClient();
    expect(client).toHaveProperty("auth");
  });

  it("calls createBrowserClient with the correct URL and anon key", async () => {
    const { createBrowserClient } = await import("@supabase/ssr");
    const { createClient } = await import("../client");
    createClient();
    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key"
    );
  });
});

describe("src/lib/supabase/server.ts — server client factory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns an object with auth property", async () => {
    const { createClient } = await import("../server");
    const client = await createClient();
    expect(client).toHaveProperty("auth");
  });

  it("calls cookies() from next/headers", async () => {
    const { cookies } = await import("next/headers");
    const { createClient } = await import("../server");
    await createClient();
    expect(cookies).toHaveBeenCalled();
  });

  it("passes cookie handlers to createServerClient", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const { createClient } = await import("../server");
    await createClient();
    expect(createServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });

  it("getAll cookie handler returns cookies from store", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const { createClient } = await import("../server");
    await createClient();

    const callArgs = (createServerClient as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const cookieHandlers = callArgs[2].cookies;
    const result = await cookieHandlers.getAll();
    expect(result).toEqual([{ name: "sb-token", value: "test-value" }]);
  });

  it("setAll cookie handler does not throw in Server Component context", async () => {
    // Server Components cannot write cookies — setAll wraps in try/catch
    const { createServerClient } = await import("@supabase/ssr");
    const { createClient } = await import("../server");
    await createClient();

    const callArgs = (createServerClient as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const cookieHandlers = callArgs[2].cookies;
    // Should not throw even if cookieStore.set throws
    mockCookieStore.set.mockImplementation(() => {
      throw new Error("Cannot set cookies in Server Component");
    });
    expect(() =>
      cookieHandlers.setAll([
        { name: "test", value: "val", options: {} },
      ])
    ).not.toThrow();
  });
});
