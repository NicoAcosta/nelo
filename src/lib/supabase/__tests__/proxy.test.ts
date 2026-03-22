import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mock @supabase/ssr
// ---------------------------------------------------------------------------
const mockGetUser = vi.fn();
const mockSetAll = vi.fn();
const mockGetAll = vi.fn(() => []);

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn((_url, _key, opts) => ({
    auth: {
      getUser: mockGetUser,
    },
    // Expose the cookie handlers so we can test them
    _cookieHandlers: opts.cookies,
  })),
}));

// ---------------------------------------------------------------------------
// Mock next/server — minimal NextRequest + NextResponse
// ---------------------------------------------------------------------------
const mockResponseHeaders = new Map<string, string>();
const mockResponseCookies = new Map<
  string,
  { value: string; options?: Record<string, unknown> }
>();

const mockNextResponse = {
  headers: {
    set: vi.fn((key: string, value: string) =>
      mockResponseHeaders.set(key, value)
    ),
    get: vi.fn((key: string) => mockResponseHeaders.get(key) ?? null),
  },
  cookies: {
    set: vi.fn(
      (
        name: string,
        value: string,
        options?: Record<string, unknown>
      ) => {
        mockResponseCookies.set(name, { value, options });
      }
    ),
    get: vi.fn((name: string) => mockResponseCookies.get(name)),
  },
};

const mockRedirectResponse = {
  type: "redirect",
  headers: { set: vi.fn() },
  cookies: { set: vi.fn() },
};

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>(
    "next/server"
  );
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => mockNextResponse),
      redirect: vi.fn(() => mockRedirectResponse),
    },
  };
});

// ---------------------------------------------------------------------------
// Helper to build a minimal NextRequest-like object
// ---------------------------------------------------------------------------
function makeRequest(pathname: string): NextRequest {
  const url = `https://app.nelo.ar${pathname}`;
  return {
    url,
    nextUrl: { pathname },
    cookies: {
      getAll: mockGetAll,
      set: vi.fn(),
    },
    headers: {
      get: vi.fn(),
    },
  } as unknown as NextRequest;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("src/lib/supabase/proxy.ts — updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponseHeaders.clear();
    mockResponseCookies.clear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns an object with supabaseResponse and user properties", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { updateSession } = await import("../proxy");
    const request = makeRequest("/chat");
    const result = await updateSession(request);
    expect(result).toHaveProperty("supabaseResponse");
    expect(result).toHaveProperty("user");
  });

  it("sets Cache-Control: private, no-store on the response", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { updateSession } = await import("../proxy");
    const request = makeRequest("/chat");
    await updateSession(request);
    expect(mockNextResponse.headers.set).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-store"
    );
  });

  it("returns null user when getUser returns null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { updateSession } = await import("../proxy");
    const result = await updateSession(makeRequest("/"));
    expect(result.user).toBeNull();
  });

  it("returns user object when getUser returns a user", async () => {
    const fakeUser = { id: "user-123", email: "test@nelo.ar" };
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    const { updateSession } = await import("../proxy");
    const result = await updateSession(makeRequest("/"));
    expect(result.user).toEqual(fakeUser);
  });
});

describe("src/proxy.ts — route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponseHeaders.clear();
    mockResponseCookies.clear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("redirects unauthenticated user on /chat to /auth/sign-in?next=/chat", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { NextResponse } = await import("next/server");
    const { proxy } = await import("../../../proxy");
    await proxy(makeRequest("/chat"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringMatching(/\/auth\/sign-in\?next=%2Fchat/),
      })
    );
  });

  it("redirects unauthenticated user on /projects to /auth/sign-in?next=/projects", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { NextResponse } = await import("next/server");
    const { proxy } = await import("../../../proxy");
    await proxy(makeRequest("/projects"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringMatching(/\/auth\/sign-in\?next=%2Fprojects/),
      })
    );
  });

  it("does NOT redirect unauthenticated user on /api/chat (API routes use own 401 guard)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { NextResponse } = await import("next/server");
    const { proxy } = await import("../../../proxy");
    const result = await proxy(makeRequest("/api/chat"));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockNextResponse);
  });

  it("allows unauthenticated user on / (no redirect)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { NextResponse } = await import("next/server");
    const { proxy } = await import("../../../proxy");
    const result = await proxy(makeRequest("/"));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockNextResponse);
  });

  it("redirects authenticated user on /auth/sign-in to /projects", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    const { NextResponse } = await import("next/server");
    const { proxy } = await import("../../../proxy");
    await proxy(makeRequest("/auth/sign-in"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("/projects"),
      })
    );
  });

  it("passes through authenticated user on /chat without redirect", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    const { NextResponse } = await import("next/server");
    const { proxy } = await import("../../../proxy");
    const result = await proxy(makeRequest("/chat"));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockNextResponse);
  });
});

describe("src/proxy.ts — config.matcher", () => {
  it("exports a config object with matcher", async () => {
    const { config } = await import("../../../proxy");
    expect(config).toHaveProperty("matcher");
  });

  it("matcher excludes expected paths", async () => {
    const { config } = await import("../../../proxy");
    const matcher = Array.isArray(config.matcher)
      ? config.matcher.join(",")
      : config.matcher;
    expect(matcher).toContain("_next/static");
    expect(matcher).toContain("favicon.ico");
    expect(matcher).toContain("share/");
    expect(matcher).toContain("auth/callback");
    expect(matcher).toContain("api/health");
    expect(matcher).toContain("api/cron/");
  });
});
