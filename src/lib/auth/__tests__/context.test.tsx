import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";

// Mock createClient from supabase client
const mockUnsubscribe = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
    onAuthStateChange: mockOnAuthStateChange,
    signOut: mockSignOut,
  },
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { AuthProvider, useAuth } from "../context";

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    // Suppress console.error for expected error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
    consoleSpy.mockRestore();
  });
});

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("renders children without crashing", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <div>child content</div>
        </AuthProvider>
      );
    });
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("calls supabase.auth.getUser() on mount to get initial user", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <div>test</div>
        </AuthProvider>
      );
    });
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it("calls supabase.auth.onAuthStateChange() to listen for updates", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <div>test</div>
        </AuthProvider>
      );
    });
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("provides loading=false after getUser resolves", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1", email: "test@example.com" } }, error: null });

    let capturedAuth: ReturnType<typeof useAuth> | null = null;
    function TestComponent() {
      capturedAuth = useAuth();
      return null;
    }

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(capturedAuth?.loading).toBe(false);
    });
  });

  it("provides user from getUser on mount", async () => {
    const fakeUser = { id: "user-1", email: "test@example.com" };
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    let capturedAuth: ReturnType<typeof useAuth> | null = null;
    function TestComponent() {
      capturedAuth = useAuth();
      return null;
    }

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(capturedAuth?.user?.id).toBe("user-1");
    });
  });

  it("signOut calls supabase.auth.signOut() and navigates to '/'", async () => {
    let capturedAuth: ReturnType<typeof useAuth> | null = null;
    function TestComponent() {
      capturedAuth = useAuth();
      return null;
    }

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    await act(async () => {
      await capturedAuth?.signOut();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("unsubscribes on unmount", async () => {
    let unmount: () => void;

    await act(async () => {
      const result = render(
        <AuthProvider>
          <div>test</div>
        </AuthProvider>
      );
      unmount = result.unmount;
    });

    act(() => {
      unmount();
    });

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
