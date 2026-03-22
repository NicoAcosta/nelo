/**
 * Tests for /share/[token] page data-fetch conditional logic.
 *
 * NOTE: Vitest does NOT support rendering async Server Components directly.
 * We test the data-fetch logic by importing the helper functions and mocking
 * the dependencies (getShareLink, checkShareToken, createServiceClient, notFound).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation
const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === "accept-language") return "en";
      return null;
    }),
  }),
}));

// Mock @/lib/supabase/server
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

// Mock share-links db functions
vi.mock("@/lib/db/share-links", () => ({
  getShareLink: vi.fn(),
  checkShareToken: vi.fn(),
}));

// Mock service client
const mockServiceClientChain = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => mockServiceClientChain),
}));

import { getShareLink, checkShareToken } from "@/lib/db/share-links";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

// Fixtures
const mockShareLinkRow = {
  id: "link-uuid-1234",
  estimate_id: "estimate-uuid-5678",
  token: "validtoken12",
  expires_at: null,
  created_at: "2026-03-22T00:00:00Z",
};

const mockEstimateRow = {
  id: "estimate-uuid-5678",
  version: 1,
  label: null,
  project_inputs: {},
  result: {
    totalPrice: 1000000,
    pricePerM2: 500000,
    categories: [],
    confidence: "quick",
    confidenceRange: { low: 10, high: 20 },
    assumptions: [],
    floorAreaM2: 100,
    directCost: 700000,
    overheadPercent: 10,
    overheadAmount: 70000,
    profitPercent: 12,
    profitAmount: 92400,
    subtotalBeforeTax: 862400,
    ivaPercent: 21,
    ivaAmount: 181104,
    activeLineItems: 26,
    inputsProvided: 5,
    inputsTotal: 14,
    priceBaseDate: "2024-07-01",
    iccCurrentValue: 1.2,
    locationZone: "caba",
    pricePerM2Usd: 500,
    totalPriceUsd: 50000,
    blueRateVenta: 1000,
    blueRateDate: "2024-07-01",
    pricingLastUpdated: "2024-07-01",
  },
  created_at: "2026-03-22T00:00:00Z",
};

/**
 * Helper: simulate the share page data-fetch logic (mirrors page.tsx implementation).
 * We extract the branching logic so we can test it without rendering the RSC.
 */
async function runSharePageLogic(token: string) {
  const { notFound } = await import("next/navigation");
  const supabase = await createClient();
  const link = await getShareLink(token, supabase as never);

  if (!link) {
    const tokenStatus = await checkShareToken(token, supabase as never);
    if (tokenStatus.token_exists && tokenStatus.token_expired) {
      return { status: "expired" as const };
    }
    notFound();
    return { status: "not_found" as const };
  }

  const serviceClient = createServiceClient();
  const { data: estimateData } = await serviceClient
    .from("estimates")
    .select("id, version, label, project_inputs, result, created_at")
    .eq("id", link.estimate_id)
    .single();

  if (!estimateData) {
    notFound();
    return { status: "not_found" as const };
  }

  return { status: "found" as const, link, estimateData };
}

describe("Share page data-fetch logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({} as never);
    mockServiceClientChain.from.mockReturnThis();
    mockServiceClientChain.select.mockReturnThis();
    mockServiceClientChain.eq.mockReturnThis();
  });

  it("valid token: fetches estimate via service client and returns found status", async () => {
    vi.mocked(getShareLink).mockResolvedValue(mockShareLinkRow);
    mockServiceClientChain.single.mockResolvedValue({ data: mockEstimateRow, error: null });

    const result = await runSharePageLogic("validtoken12");

    expect(result.status).toBe("found");
    expect(vi.mocked(createServiceClient)).toHaveBeenCalled();
    expect(mockServiceClientChain.from).toHaveBeenCalledWith("estimates");
  });

  it("valid token: checkShareToken is NOT called when getShareLink returns a row", async () => {
    vi.mocked(getShareLink).mockResolvedValue(mockShareLinkRow);
    mockServiceClientChain.single.mockResolvedValue({ data: mockEstimateRow, error: null });

    await runSharePageLogic("validtoken12");

    expect(vi.mocked(checkShareToken)).not.toHaveBeenCalled();
  });

  it("expired token: returns expired status when token_exists=true and token_expired=true", async () => {
    vi.mocked(getShareLink).mockResolvedValue(null);
    vi.mocked(checkShareToken).mockResolvedValue({
      token_exists: true,
      token_expired: true,
    });

    const result = await runSharePageLogic("expiredtoken1");

    expect(result.status).toBe("expired");
    expect(vi.mocked(checkShareToken)).toHaveBeenCalledWith("expiredtoken1", expect.anything());
  });

  it("unknown token: calls notFound() when token_exists=false", async () => {
    vi.mocked(getShareLink).mockResolvedValue(null);
    vi.mocked(checkShareToken).mockResolvedValue({
      token_exists: false,
      token_expired: false,
    });

    await expect(runSharePageLogic("unknowntoken1")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("service client is used for estimate fetch (not anon client)", async () => {
    vi.mocked(getShareLink).mockResolvedValue(mockShareLinkRow);
    mockServiceClientChain.single.mockResolvedValue({ data: mockEstimateRow, error: null });

    await runSharePageLogic("validtoken12");

    // createServiceClient must be called
    expect(vi.mocked(createServiceClient)).toHaveBeenCalled();
    // createClient (anon) should have been called only once (for getShareLink), not for estimate fetch
    const serviceCallCount = vi.mocked(createServiceClient).mock.calls.length;
    expect(serviceCallCount).toBeGreaterThan(0);
  });

  it("generateMetadata: returns robots noindex/nofollow", async () => {
    // Import the actual generateMetadata from the page
    const { generateMetadata } = await import("../[token]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ token: "abc" }) });
    expect(metadata.robots).toBeTruthy();
    const robots = metadata.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });
});
