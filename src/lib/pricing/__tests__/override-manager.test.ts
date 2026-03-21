/**
 * Override Manager Tests
 *
 * Tests for loadOverrides, setOverride, getOverride, removeOverride, resolveUnitCost.
 * Uses a tmp directory for test isolation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import {
  loadOverrides,
  setOverride,
  getOverride,
  removeOverride,
  resolveUnitCost,
  type ManualOverride,
} from "../override-manager";

// Helper to create a fresh tmp dir for each test and set up a clean overrides file
let tmpDir: string;
let overridesPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nelo-overrides-test-"));
  overridesPath = path.join(tmpDir, "manual-overrides.json");
  fs.writeFileSync(overridesPath, "{}");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("loadOverrides", () => {
  it("returns empty Record when manual-overrides.json has empty {}", () => {
    const result = loadOverrides(overridesPath);
    expect(result).toEqual({});
  });

  it("returns existing overrides when file has data", () => {
    const data: Record<string, ManualOverride> = {
      "4.1.1": {
        materialCost: 200000,
        laborCost: 120000,
        totalCost: 320000,
        source: "architect review",
        setAt: "2026-03-21T00:00:00.000Z",
        setBy: "test",
      },
    };
    fs.writeFileSync(overridesPath, JSON.stringify(data));
    const result = loadOverrides(overridesPath);
    expect(result["4.1.1"]).toBeDefined();
    expect(result["4.1.1"].materialCost).toBe(200000);
  });
});

describe("setOverride", () => {
  it("writes override to file and it is retrievable via loadOverrides", () => {
    setOverride(
      "4.1.1",
      { materialCost: 200000, laborCost: 120000, source: "architect review", setBy: "team" },
      overridesPath,
    );

    const result = loadOverrides(overridesPath);
    expect(result["4.1.1"]).toBeDefined();
    expect(result["4.1.1"].materialCost).toBe(200000);
    expect(result["4.1.1"].laborCost).toBe(120000);
  });

  it("auto-calculates totalCost as materialCost + laborCost", () => {
    setOverride(
      "5.1.1",
      { materialCost: 150000, laborCost: 90000, source: "review", setBy: "team" },
      overridesPath,
    );

    const result = loadOverrides(overridesPath);
    expect(result["5.1.1"].totalCost).toBe(240000);
  });

  it("sets setAt timestamp automatically", () => {
    setOverride(
      "4.1.1",
      { materialCost: 200000, laborCost: 120000, source: "test", setBy: "team" },
      overridesPath,
    );

    const result = loadOverrides(overridesPath);
    expect(result["4.1.1"].setAt).toBeDefined();
    expect(() => new Date(result["4.1.1"].setAt)).not.toThrow();
  });

  it("merges with existing overrides (does not delete other keys)", () => {
    setOverride(
      "4.1.1",
      { materialCost: 200000, laborCost: 120000, source: "review", setBy: "team" },
      overridesPath,
    );
    setOverride(
      "5.1.1",
      { materialCost: 50000, laborCost: 30000, source: "review", setBy: "team" },
      overridesPath,
    );

    const result = loadOverrides(overridesPath);
    expect(result["4.1.1"]).toBeDefined();
    expect(result["5.1.1"]).toBeDefined();
  });
});

describe("getOverride", () => {
  it("returns the override when it exists", () => {
    setOverride(
      "4.1.1",
      { materialCost: 200000, laborCost: 120000, source: "architect review", setBy: "team" },
      overridesPath,
    );

    const result = getOverride("4.1.1", overridesPath);
    expect(result).not.toBeNull();
    expect(result!.materialCost).toBe(200000);
  });

  it("returns null when override does not exist", () => {
    const result = getOverride("9.9.9", overridesPath);
    expect(result).toBeNull();
  });
});

describe("removeOverride", () => {
  it("removes an existing override", () => {
    setOverride(
      "4.1.1",
      { materialCost: 200000, laborCost: 120000, source: "review", setBy: "team" },
      overridesPath,
    );
    expect(getOverride("4.1.1", overridesPath)).not.toBeNull();

    removeOverride("4.1.1", overridesPath);

    expect(getOverride("4.1.1", overridesPath)).toBeNull();
  });

  it("does not throw when removing a non-existent override", () => {
    expect(() => removeOverride("9.9.9", overridesPath)).not.toThrow();
  });

  it("only removes the specified key, not others", () => {
    setOverride(
      "4.1.1",
      { materialCost: 200000, laborCost: 120000, source: "review", setBy: "team" },
      overridesPath,
    );
    setOverride(
      "5.1.1",
      { materialCost: 50000, laborCost: 30000, source: "review", setBy: "team" },
      overridesPath,
    );

    removeOverride("4.1.1", overridesPath);

    expect(getOverride("4.1.1", overridesPath)).toBeNull();
    expect(getOverride("5.1.1", overridesPath)).not.toBeNull();
  });
});

describe("resolveUnitCost", () => {
  it("returns manual override when one exists (source === 'manual_override', isPlaceholder === false)", () => {
    setOverride(
      "4.1.1",
      { materialCost: 200000, laborCost: 120000, source: "architect review", setBy: "team" },
      overridesPath,
    );

    const result = resolveUnitCost("4.1.1", overridesPath);
    expect(result).not.toBeNull();
    expect(result!.source).toBe("manual_override");
    expect(result!.isPlaceholder).toBe(false);
    expect(result!.materialCost).toBe(200000);
    expect(result!.laborCost).toBe(120000);
    expect(result!.totalCost).toBe(320000);
    expect(result!.itemCode).toBe("4.1.1");
  });

  it("returns AMBA_UNIT_COSTS entry when no override exists", () => {
    const result = resolveUnitCost("4.1.1", overridesPath);
    expect(result).not.toBeNull();
    // source should be non-empty and not "placeholder" (real prices now populated)
    expect(result!.source).toBeTruthy();
    expect(result!.isPlaceholder).toBe(false);
  });

  it("returns null for a non-existent item code with no override", () => {
    const result = resolveUnitCost("nonexistent.99.99", overridesPath);
    expect(result).toBeNull();
  });

  it("uses override's setAt as lastUpdated when override exists", () => {
    setOverride(
      "4.1.1",
      { materialCost: 200000, laborCost: 120000, source: "review", setBy: "team" },
      overridesPath,
    );

    const override = getOverride("4.1.1", overridesPath)!;
    const result = resolveUnitCost("4.1.1", overridesPath);
    expect(result!.lastUpdated).toBe(override.setAt);
  });
});
