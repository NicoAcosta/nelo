import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { storePendingFiles, retrievePendingFiles } from "../pending-files";

beforeEach(() => {
  // Clear all IndexedDB databases between tests
  indexedDB = new IDBFactory();
});

describe("pending-files", () => {
  it("stores and retrieves files with correct name, type, and content", async () => {
    const content = new Uint8Array([1, 2, 3, 4]);
    const file = new File([content], "plan.dxf", { type: "application/dxf" });

    await storePendingFiles([file]);
    const result = await retrievePendingFiles();

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].name).toBe("plan.dxf");
    expect(result![0].type).toBe("application/dxf");
    expect(result![0].size).toBe(4);

    const buf = await result![0].arrayBuffer();
    expect(new Uint8Array(buf)).toEqual(content);
  });

  it("handles multiple files", async () => {
    const files = [
      new File(["aaa"], "a.png", { type: "image/png" }),
      new File(["bbb"], "b.pdf", { type: "application/pdf" }),
      new File(["ccc"], "c.dxf", { type: "application/dxf" }),
    ];

    await storePendingFiles(files);
    const result = await retrievePendingFiles();

    expect(result).toHaveLength(3);
    expect(result!.map((f) => f.name)).toEqual(["a.png", "b.pdf", "c.dxf"]);
  });

  it("returns null when nothing is stored", async () => {
    const result = await retrievePendingFiles();
    expect(result).toBeNull();
  });

  it("deletes files after retrieval", async () => {
    await storePendingFiles([new File(["x"], "test.png", { type: "image/png" })]);

    const first = await retrievePendingFiles();
    expect(first).toHaveLength(1);

    const second = await retrievePendingFiles();
    expect(second).toBeNull();
  });

  it("overwrites previous pending files", async () => {
    await storePendingFiles([new File(["old"], "old.png", { type: "image/png" })]);
    await storePendingFiles([new File(["new"], "new.pdf", { type: "application/pdf" })]);

    const result = await retrievePendingFiles();
    expect(result).toHaveLength(1);
    expect(result![0].name).toBe("new.pdf");
  });
});
