import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache before importing the action
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock the Supabase server client
const mockEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

import { updateProjectTitle } from "../projects";
import { revalidatePath } from "next/cache";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("updateProjectTitle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null, count: 1 });
  });

  it("calls supabase update with correct args and returns {}", async () => {
    const result = await updateProjectTitle(VALID_UUID, "My House");

    expect(mockFrom).toHaveBeenCalledWith("projects");
    expect(mockUpdate).toHaveBeenCalledWith({ title: "My House" }, { count: "exact" });
    expect(mockEq).toHaveBeenCalledWith("id", VALID_UUID);
    expect(result).toEqual({});
  });

  it("trims whitespace before updating", async () => {
    const result = await updateProjectTitle(VALID_UUID, "  My House  ");

    expect(mockUpdate).toHaveBeenCalledWith({ title: "My House" }, { count: "exact" });
    expect(result).toEqual({});
  });

  it("returns error for invalid UUID without calling supabase", async () => {
    const result = await updateProjectTitle("not-a-uuid", "Valid Title");

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Invalid project ID" });
  });

  it("returns error for empty title without calling supabase", async () => {
    const result = await updateProjectTitle(VALID_UUID, "");

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Title cannot be empty" });
  });

  it("returns error for whitespace-only title without calling supabase", async () => {
    const result = await updateProjectTitle(VALID_UUID, "   ");

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Title cannot be empty" });
  });

  it("returns error when title exceeds 100 characters without calling supabase", async () => {
    const result = await updateProjectTitle(VALID_UUID, "x".repeat(101));

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Title too long" });
  });

  it("returns { error: message } when supabase update fails", async () => {
    mockEq.mockResolvedValue({ error: { message: "update failed" }, count: null });

    const result = await updateProjectTitle(VALID_UUID, "Valid Title");

    expect(result).toEqual({ error: "update failed" });
  });

  it("returns error when no rows updated (RLS blocked or not found)", async () => {
    mockEq.mockResolvedValue({ error: null, count: 0 });

    const result = await updateProjectTitle(VALID_UUID, "Valid Title");

    expect(result).toEqual({ error: "Project not found" });
  });

  it("calls revalidatePath('/projects') on success", async () => {
    await updateProjectTitle(VALID_UUID, "My House");

    expect(revalidatePath).toHaveBeenCalledWith("/projects");
  });
});
