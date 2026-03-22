import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache before importing the action
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock the Supabase server client
const mockSupabase = {};
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock DB functions
vi.mock("@/lib/db/estimates", () => ({
  listEstimates: vi.fn(),
  getEstimate: vi.fn(),
  updateEstimateLabel: vi.fn(),
  getConversationId: vi.fn(),
}));

import {
  listEstimatesAction,
  getEstimateAction,
  updateEstimateLabelAction,
  getConversationIdAction,
} from "../estimates";
import { revalidatePath } from "next/cache";
import { listEstimates, getEstimate, updateEstimateLabel, getConversationId } from "@/lib/db/estimates";
import type { EstimateSummary, EstimateRow } from "@/lib/db/estimates";
import type { Estimate, ProjectInputs } from "@/lib/estimate/types";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const INVALID_UUID = "not-a-uuid";

function makeSummary(): EstimateSummary {
  return {
    id: VALID_UUID,
    version: 1,
    label: null,
    total_price: 10_000_000,
    price_per_m2: 100_000,
    created_at: "2026-03-22T09:00:00Z",
  };
}

function makeEstimateRow(): EstimateRow {
  const result = {
    pricePerM2: 100_000,
    totalPrice: 10_000_000,
  } as Estimate;
  const inputs = { totalFloorAreaM2: 100 } as ProjectInputs;
  return {
    id: VALID_UUID,
    version: 1,
    label: null,
    project_inputs: inputs,
    result,
    created_at: "2026-03-22T09:00:00Z",
  };
}

// ---------------------------------------------------------------------------
// listEstimatesAction
// ---------------------------------------------------------------------------

describe("listEstimatesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns EstimateSummary[] for valid conversationId", async () => {
    const summaries = [makeSummary()];
    vi.mocked(listEstimates).mockResolvedValueOnce(summaries);

    const result = await listEstimatesAction(VALID_UUID);

    expect(result).toEqual(summaries);
    expect(listEstimates).toHaveBeenCalledWith(VALID_UUID, mockSupabase);
  });

  it("returns error for invalid conversation ID (non-UUID)", async () => {
    const result = await listEstimatesAction(INVALID_UUID);

    expect(result).toEqual({ error: "Invalid conversation ID" });
    expect(listEstimates).not.toHaveBeenCalled();
  });

  it("returns empty array when no estimates exist", async () => {
    vi.mocked(listEstimates).mockResolvedValueOnce([]);

    const result = await listEstimatesAction(VALID_UUID);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getEstimateAction
// ---------------------------------------------------------------------------

describe("getEstimateAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns EstimateRow for valid estimateId", async () => {
    const row = makeEstimateRow();
    vi.mocked(getEstimate).mockResolvedValueOnce(row);

    const result = await getEstimateAction(VALID_UUID);

    expect(result).toEqual(row);
    expect(getEstimate).toHaveBeenCalledWith(VALID_UUID, mockSupabase);
  });

  it("returns null when estimate not found", async () => {
    vi.mocked(getEstimate).mockResolvedValueOnce(null);

    const result = await getEstimateAction(VALID_UUID);
    expect(result).toBeNull();
  });

  it("returns error for invalid estimate ID (non-UUID)", async () => {
    const result = await getEstimateAction(INVALID_UUID);

    expect(result).toEqual({ error: "Invalid estimate ID" });
    expect(getEstimate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// updateEstimateLabelAction
// ---------------------------------------------------------------------------

describe("updateEstimateLabelAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateEstimateLabel).mockResolvedValue(undefined);
  });

  it("calls updateEstimateLabel with trimmed label and returns {} on success", async () => {
    const result = await updateEstimateLabelAction(VALID_UUID, "My revision");

    expect(updateEstimateLabel).toHaveBeenCalledWith(
      VALID_UUID,
      "My revision",
      mockSupabase
    );
    expect(result).toEqual({});
  });

  it("trims label before updating", async () => {
    await updateEstimateLabelAction(VALID_UUID, "  Revised  ");

    expect(updateEstimateLabel).toHaveBeenCalledWith(
      VALID_UUID,
      "Revised",
      mockSupabase
    );
  });

  it("calls revalidatePath('/chat') on success", async () => {
    await updateEstimateLabelAction(VALID_UUID, "My label");

    expect(revalidatePath).toHaveBeenCalledWith("/chat");
  });

  it("returns error for invalid estimate ID (non-UUID)", async () => {
    const result = await updateEstimateLabelAction(INVALID_UUID, "label");

    expect(result).toEqual({ error: "Invalid estimate ID" });
    expect(updateEstimateLabel).not.toHaveBeenCalled();
  });

  it("returns error for empty label", async () => {
    const result = await updateEstimateLabelAction(VALID_UUID, "");

    expect(result).toEqual({ error: "Label cannot be empty" });
    expect(updateEstimateLabel).not.toHaveBeenCalled();
  });

  it("returns error for whitespace-only label", async () => {
    const result = await updateEstimateLabelAction(VALID_UUID, "   ");

    expect(result).toEqual({ error: "Label cannot be empty" });
    expect(updateEstimateLabel).not.toHaveBeenCalled();
  });

  it("returns error for label longer than 100 chars", async () => {
    const longLabel = "a".repeat(101);
    const result = await updateEstimateLabelAction(VALID_UUID, longLabel);

    expect(result).toEqual({ error: "Label too long" });
    expect(updateEstimateLabel).not.toHaveBeenCalled();
  });

  it("accepts label of exactly 100 chars", async () => {
    const maxLabel = "a".repeat(100);
    const result = await updateEstimateLabelAction(VALID_UUID, maxLabel);

    expect(result).toEqual({});
    expect(updateEstimateLabel).toHaveBeenCalled();
  });

  it("returns error message when updateEstimateLabel throws", async () => {
    vi.mocked(updateEstimateLabel).mockRejectedValueOnce(
      new Error("DB connection failed")
    );

    const result = await updateEstimateLabelAction(VALID_UUID, "label");

    expect(result).toEqual({ error: "DB connection failed" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns generic error message for non-Error throws", async () => {
    vi.mocked(updateEstimateLabel).mockRejectedValueOnce("unknown error");

    const result = await updateEstimateLabelAction(VALID_UUID, "label");

    expect(result).toEqual({ error: "Failed to update label" });
  });
});

// ---------------------------------------------------------------------------
// getConversationIdAction
// ---------------------------------------------------------------------------

describe("getConversationIdAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns conversation ID for valid project ID", async () => {
    vi.mocked(getConversationId).mockResolvedValueOnce(VALID_UUID);

    const result = await getConversationIdAction(VALID_UUID);

    expect(result).toBe(VALID_UUID);
    expect(getConversationId).toHaveBeenCalledWith(VALID_UUID, mockSupabase);
  });

  it("returns null for invalid project ID (non-UUID)", async () => {
    const result = await getConversationIdAction(INVALID_UUID);

    expect(result).toBeNull();
    expect(getConversationId).not.toHaveBeenCalled();
  });

  it("returns null when no conversation found", async () => {
    vi.mocked(getConversationId).mockResolvedValueOnce(null);

    const result = await getConversationIdAction(VALID_UUID);
    expect(result).toBeNull();
  });

  it("returns null when DB throws", async () => {
    vi.mocked(getConversationId).mockRejectedValueOnce(new Error("timeout"));

    const result = await getConversationIdAction(VALID_UUID);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Error wrapping in listEstimatesAction and getEstimateAction
// ---------------------------------------------------------------------------

describe("listEstimatesAction error handling", () => {
  it("returns error when DB throws", async () => {
    vi.mocked(listEstimates).mockRejectedValueOnce(new Error("DB timeout"));

    const result = await listEstimatesAction(VALID_UUID);

    expect(result).toEqual({ error: "DB timeout" });
  });
});

describe("getEstimateAction error handling", () => {
  it("returns error when DB throws", async () => {
    vi.mocked(getEstimate).mockRejectedValueOnce(new Error("Connection refused"));

    const result = await getEstimateAction(VALID_UUID);

    expect(result).toEqual({ error: "Connection refused" });
  });
});
