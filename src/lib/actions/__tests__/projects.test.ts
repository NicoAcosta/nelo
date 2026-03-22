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

describe("updateProjectTitle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  it("calls supabase update with correct args and returns {}", async () => {
    const result = await updateProjectTitle("proj-1", "My House");

    expect(mockFrom).toHaveBeenCalledWith("projects");
    expect(mockUpdate).toHaveBeenCalledWith({ title: "My House" });
    expect(mockEq).toHaveBeenCalledWith("id", "proj-1");
    expect(result).toEqual({});
  });

  it("trims whitespace before updating", async () => {
    const result = await updateProjectTitle("proj-1", "  My House  ");

    expect(mockUpdate).toHaveBeenCalledWith({ title: "My House" });
    expect(result).toEqual({});
  });

  it("returns error for empty title without calling supabase", async () => {
    const result = await updateProjectTitle("proj-1", "");

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Title cannot be empty" });
  });

  it("returns error for whitespace-only title without calling supabase", async () => {
    const result = await updateProjectTitle("proj-1", "   ");

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Title cannot be empty" });
  });

  it("returns error when title exceeds 100 characters without calling supabase", async () => {
    const result = await updateProjectTitle("proj-1", "x".repeat(101));

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Title too long" });
  });

  it("returns { error: message } when supabase update fails", async () => {
    mockEq.mockResolvedValue({ error: { message: "update failed" } });

    const result = await updateProjectTitle("proj-1", "Valid Title");

    expect(result).toEqual({ error: "update failed" });
  });

  it("calls revalidatePath('/projects') on success", async () => {
    await updateProjectTitle("proj-1", "My House");

    expect(revalidatePath).toHaveBeenCalledWith("/projects");
  });
});
