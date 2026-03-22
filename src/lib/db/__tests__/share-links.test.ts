import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock nanoid
// ---------------------------------------------------------------------------
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "abc123def456"),
}));

// ---------------------------------------------------------------------------
// Mock Supabase server client
// ---------------------------------------------------------------------------
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.fn();

// share_links table mocks
const mockInsertSingle = vi.fn();
const mockInsertSelect = vi.fn(() => ({ single: mockInsertSingle }));
const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));
const mockDeleteEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
const mockSelectEqMaybeSingle = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelectEq = vi.fn(() => ({
  maybeSingle: mockMaybeSingle,
  single: mockSingle,
}));
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
}));

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import {
  getShareLink,
  getShareLinkByEstimateId,
  createShareLink,
  deleteShareLink,
  checkShareToken,
} from "../share-links";
import {
  createShareLinkAction,
  deleteShareLinkAction,
  getShareLinkForEstimateAction,
} from "@/lib/actions/share-links";
import { nanoid } from "nanoid";

const ESTIMATE_UUID = "11111111-1111-1111-1111-111111111111";
const SHARE_LINK_UUID = "22222222-2222-2222-2222-222222222222";
const TOKEN = "abc123def456";

function makeShareLinkRow(overrides: Record<string, unknown> = {}) {
  return {
    id: SHARE_LINK_UUID,
    estimate_id: ESTIMATE_UUID,
    token: TOKEN,
    expires_at: null,
    created_at: "2026-03-22T10:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createShareLink
// ---------------------------------------------------------------------------

describe("createShareLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ShareLinkRow with null expires_at when expiresInDays is null", async () => {
    const row = makeShareLinkRow();
    mockInsertSingle.mockResolvedValueOnce({ data: row, error: null });

    const result = await createShareLink(ESTIMATE_UUID, null);

    expect(result).toEqual(row);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        estimate_id: ESTIMATE_UUID,
        token: TOKEN,
        expires_at: null,
      }),
    );
  });

  it("returns a token of length 12 from nanoid(12)", async () => {
    const row = makeShareLinkRow();
    mockInsertSingle.mockResolvedValueOnce({ data: row, error: null });

    await createShareLink(ESTIMATE_UUID, null);

    expect(nanoid).toHaveBeenCalledWith(12);
  });

  it("returns expires_at approximately 7 days from now when expiresInDays=7", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-03-22T10:00:00Z");
    vi.setSystemTime(now);

    const expectedExpiresAt = new Date(
      now.getTime() + 7 * 86400000,
    ).toISOString();
    const row = makeShareLinkRow({ expires_at: expectedExpiresAt });
    mockInsertSingle.mockResolvedValueOnce({ data: row, error: null });

    await createShareLink(ESTIMATE_UUID, 7);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        expires_at: expectedExpiresAt,
      }),
    );

    vi.useRealTimers();
  });

  it("returns expires_at approximately 30 days from now when expiresInDays=30", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-03-22T10:00:00Z");
    vi.setSystemTime(now);

    const expectedExpiresAt = new Date(
      now.getTime() + 30 * 86400000,
    ).toISOString();
    const row = makeShareLinkRow({ expires_at: expectedExpiresAt });
    mockInsertSingle.mockResolvedValueOnce({ data: row, error: null });

    await createShareLink(ESTIMATE_UUID, 30);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        expires_at: expectedExpiresAt,
      }),
    );

    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// getShareLinkByEstimateId
// ---------------------------------------------------------------------------

describe("getShareLinkByEstimateId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing ShareLinkRow when found", async () => {
    const row = makeShareLinkRow();
    mockMaybeSingle.mockResolvedValueOnce({ data: row, error: null });

    const result = await getShareLinkByEstimateId(ESTIMATE_UUID);

    expect(result).toEqual(row);
    expect(mockSelect).toHaveBeenCalledWith(
      "id, estimate_id, token, expires_at, created_at",
    );
    expect(mockSelectEq).toHaveBeenCalledWith("estimate_id", ESTIMATE_UUID);
  });

  it("returns null when no link exists", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await getShareLinkByEstimateId(ESTIMATE_UUID);

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// deleteShareLink
// ---------------------------------------------------------------------------

describe("deleteShareLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls delete with the correct id", async () => {
    mockDeleteEq.mockResolvedValueOnce({ error: null });

    await deleteShareLink(SHARE_LINK_UUID);

    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith("id", SHARE_LINK_UUID);
  });

  it("throws on delete failure", async () => {
    mockDeleteEq.mockResolvedValueOnce({
      error: { message: "Delete failed" },
    });

    await expect(deleteShareLink(SHARE_LINK_UUID)).rejects.toThrow(
      "Delete failed",
    );
  });
});

// ---------------------------------------------------------------------------
// checkShareToken
// ---------------------------------------------------------------------------

describe("checkShareToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { token_exists: true, token_expired: false } for valid non-expired token", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ token_exists: true, token_expired: false }],
      error: null,
    });

    const result = await checkShareToken(TOKEN);

    expect(result).toEqual({ token_exists: true, token_expired: false });
    expect(mockRpc).toHaveBeenCalledWith("check_share_token", {
      share_token: TOKEN,
    });
  });

  it("returns { token_exists: true, token_expired: true } for expired token", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ token_exists: true, token_expired: true }],
      error: null,
    });

    const result = await checkShareToken(TOKEN);

    expect(result).toEqual({ token_exists: true, token_expired: true });
  });

  it("returns { token_exists: false, token_expired: false } for unknown token", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ token_exists: false, token_expired: false }],
      error: null,
    });

    const result = await checkShareToken("unknown-token");

    expect(result).toEqual({ token_exists: false, token_expired: false });
  });
});

// ---------------------------------------------------------------------------
// Server actions — UUID validation
// ---------------------------------------------------------------------------

describe("createShareLinkAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { error: 'Invalid estimate ID' } for non-UUID input", async () => {
    const result = await createShareLinkAction("not-a-uuid", null);
    expect(result).toEqual({ error: "Invalid estimate ID" });
  });

  it("returns existing link if already exists (D-04 no-duplicates)", async () => {
    const row = makeShareLinkRow();
    mockMaybeSingle.mockResolvedValueOnce({ data: row, error: null });

    const result = await createShareLinkAction(ESTIMATE_UUID, null);

    expect(result).toEqual(row);
    // createShareLink (insert) should NOT be called since link already exists
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("creates new link when none exists", async () => {
    // getShareLinkByEstimateId returns null (no existing)
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    // createShareLink insert
    const row = makeShareLinkRow();
    mockInsertSingle.mockResolvedValueOnce({ data: row, error: null });

    const result = await createShareLinkAction(ESTIMATE_UUID, null);

    expect(result).toEqual(row);
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("deleteShareLinkAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { error: 'Invalid share link ID' } for non-UUID input", async () => {
    const result = await deleteShareLinkAction("not-a-uuid");
    expect(result).toEqual({ error: "Invalid share link ID" });
  });

  it("calls deleteShareLink and returns {} on success", async () => {
    mockDeleteEq.mockResolvedValueOnce({ error: null });

    const result = await deleteShareLinkAction(SHARE_LINK_UUID);

    expect(result).toEqual({});
    expect(mockDeleteEq).toHaveBeenCalledWith("id", SHARE_LINK_UUID);
  });
});

describe("getShareLinkForEstimateAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { error: 'Invalid estimate ID' } for non-UUID input", async () => {
    const result = await getShareLinkForEstimateAction("not-a-uuid");
    expect(result).toEqual({ error: "Invalid estimate ID" });
  });

  it("returns existing ShareLinkRow when found", async () => {
    const row = makeShareLinkRow();
    mockMaybeSingle.mockResolvedValueOnce({ data: row, error: null });

    const result = await getShareLinkForEstimateAction(ESTIMATE_UUID);
    expect(result).toEqual(row);
  });
});
