import { describe, it, expect } from "vitest";
import { extractEstimateFromMessages } from "../conversations";
import type { UIMessage } from "ai";

const mockEstimate = {
  totalPrice: 187450000,
  pricePerM2: 1041389,
  categories: [],
  confidence: "standard" as const,
  locationZone: "caba" as const,
} as any;

const mockInputs = {
  totalFloorAreaM2: 180,
  stories: 2,
  structureType: "hormigon_armado",
};

describe("extractEstimateFromMessages", () => {
  it("extracts the last runEstimate tool result", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "user",
        content: "estimate my house",
        parts: [{ type: "text", text: "estimate my house" }],
      },
      {
        id: "2",
        role: "assistant",
        content: "",
        parts: [
          {
            type: "tool-runEstimate",
            toolInvocationId: "t1",
            state: "output-available",
            args: mockInputs,
            output: mockEstimate,
          } as any,
        ],
      },
    ];
    const result = extractEstimateFromMessages(messages);
    expect(result).not.toBeNull();
    expect(result!.estimate.totalPrice).toBe(187450000);
    expect(result!.inputs.totalFloorAreaM2).toBe(180);
  });

  it("returns null when no runEstimate tool call exists", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "user",
        content: "hello",
        parts: [{ type: "text", text: "hello" }],
      },
    ];
    expect(extractEstimateFromMessages(messages)).toBeNull();
  });

  it("returns the last estimate when multiple exist", () => {
    const estimate1 = { ...mockEstimate, totalPrice: 100 };
    const estimate2 = { ...mockEstimate, totalPrice: 200 };
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        parts: [
          {
            type: "tool-runEstimate",
            toolInvocationId: "t1",
            state: "output-available",
            args: mockInputs,
            output: estimate1,
          } as any,
        ],
      },
      {
        id: "2",
        role: "assistant",
        content: "",
        parts: [
          {
            type: "tool-runEstimate",
            toolInvocationId: "t2",
            state: "output-available",
            args: mockInputs,
            output: estimate2,
          } as any,
        ],
      },
    ];
    const result = extractEstimateFromMessages(messages);
    expect(result!.estimate.totalPrice).toBe(200);
  });
});
