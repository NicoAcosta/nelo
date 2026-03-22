import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "@/lib/i18n/context";
import type { ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

function renderWithLocale(ui: React.ReactElement) {
  return render(ui, { wrapper: Wrapper });
}

// Mock server actions
vi.mock("@/lib/actions/share-links", () => ({
  createShareLinkAction: vi.fn(),
  deleteShareLinkAction: vi.fn(),
  getShareLinkForEstimateAction: vi.fn(),
}));

import {
  createShareLinkAction,
  deleteShareLinkAction,
  getShareLinkForEstimateAction,
} from "@/lib/actions/share-links";

import { SharePopover } from "../share-popover";

// Fixture data
const mockShareLink = {
  id: "link-uuid-1234",
  estimate_id: "estimate-uuid-5678",
  token: "abcdef123456",
  expires_at: null,
  created_at: "2026-03-22T00:00:00Z",
};

describe("SharePopover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing link
    vi.mocked(getShareLinkForEstimateAction).mockResolvedValue(null);
    vi.mocked(createShareLinkAction).mockResolvedValue(mockShareLink);
    vi.mocked(deleteShareLinkAction).mockResolvedValue({});
    // Mock clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  it("renders Create shareable link button when no existing link", async () => {
    vi.mocked(getShareLinkForEstimateAction).mockResolvedValue(null);
    renderWithLocale(<SharePopover estimateId="estimate-uuid-5678" />);

    // Open popover by clicking the trigger
    const trigger = screen.getByRole("button", { name: /share/i });
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create shareable link/i })).toBeTruthy();
    });
  });

  it("renders expiration select with No expiration, 7 days, 30 days, 90 days options", async () => {
    vi.mocked(getShareLinkForEstimateAction).mockResolvedValue(null);
    renderWithLocale(<SharePopover estimateId="estimate-uuid-5678" />);

    const trigger = screen.getByRole("button", { name: /share/i });
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeTruthy();
    });

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.text);
    expect(options).toContain("No expiration");
    expect(options).toContain("7 days");
    expect(options).toContain("30 days");
    expect(options).toContain("90 days");
  });

  it("clicking Create shareable link calls createShareLinkAction with estimateId and expiresInDays", async () => {
    vi.mocked(getShareLinkForEstimateAction).mockResolvedValue(null);
    renderWithLocale(<SharePopover estimateId="estimate-uuid-5678" />);

    const trigger = screen.getByRole("button", { name: /share/i });
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create shareable link/i })).toBeTruthy();
    });

    const createBtn = screen.getByRole("button", { name: /create shareable link/i });
    await userEvent.click(createBtn);

    await waitFor(() => {
      expect(vi.mocked(createShareLinkAction)).toHaveBeenCalledWith(
        "estimate-uuid-5678",
        null, // default is null (no expiration)
      );
    });
  });

  it("shows the share URL and Copy button when existing link is present (no Create button)", async () => {
    vi.mocked(getShareLinkForEstimateAction).mockResolvedValue(mockShareLink);
    renderWithLocale(<SharePopover estimateId="estimate-uuid-5678" />);

    const trigger = screen.getByRole("button", { name: /share/i });
    await userEvent.click(trigger);

    await waitFor(() => {
      // Should show URL containing the token
      expect(screen.getByText(/abcdef123456/)).toBeTruthy();
      // Should have Copy button
      expect(screen.getByRole("button", { name: /copy/i })).toBeTruthy();
      // Should NOT have Create button
      expect(screen.queryByRole("button", { name: /create shareable link/i })).toBeNull();
    });
  });

  it("clicking Revoke link shows inline Are you sure? confirmation", async () => {
    vi.mocked(getShareLinkForEstimateAction).mockResolvedValue(mockShareLink);
    renderWithLocale(<SharePopover estimateId="estimate-uuid-5678" />);

    const trigger = screen.getByRole("button", { name: /share/i });
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /revoke/i })).toBeTruthy();
    });

    const revokeBtn = screen.getByRole("button", { name: /revoke/i });
    await userEvent.click(revokeBtn);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeTruthy();
    });
  });

  it("confirming revoke calls deleteShareLinkAction with the link id", async () => {
    vi.mocked(getShareLinkForEstimateAction).mockResolvedValue(mockShareLink);
    renderWithLocale(<SharePopover estimateId="estimate-uuid-5678" />);

    const trigger = screen.getByRole("button", { name: /share/i });
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /revoke/i })).toBeTruthy();
    });

    await userEvent.click(screen.getByRole("button", { name: /revoke/i }));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeTruthy();
    });

    // Click "Yes, revoke" confirmation button
    const confirmBtn = screen.getByRole("button", { name: /yes.*revoke/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(vi.mocked(deleteShareLinkAction)).toHaveBeenCalledWith("link-uuid-1234");
    });
  });
});

describe("EstimateTopbar with SharePopover", () => {
  it("renders SharePopover when estimateId prop is provided", async () => {
    const { EstimateTopbar } = await import("../estimate-topbar");
    renderWithLocale(
      <EstimateTopbar
        projectName="Test Project"
        chatId="chat-123"
        locationLabel="CABA"
        estimateId="estimate-uuid-5678"
      />,
    );

    // Should have the share trigger button that opens popover
    expect(screen.getByRole("button", { name: /share/i })).toBeTruthy();
  });

  it("does NOT render SharePopover when estimateId is undefined", async () => {
    const { EstimateTopbar } = await import("../estimate-topbar");

    vi.mocked(getShareLinkForEstimateAction).mockResolvedValue(null);

    renderWithLocale(
      <EstimateTopbar
        projectName="Test Project"
        chatId="chat-123"
        locationLabel="CABA"
        estimateId={undefined}
      />,
    );

    // Without estimateId, should show the old clipboard share button (not popover)
    const shareButtons = screen.getAllByRole("button");
    const shareBtn = shareButtons.find(
      (btn) => btn.textContent?.includes("Share") || btn.textContent?.includes("↗"),
    );
    expect(shareBtn).toBeTruthy();
  });
});
