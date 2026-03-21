import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { LocaleProvider } from "../context";
import { useLocale } from "../use-locale";

function wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

describe("LocaleProvider + useLocale", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns locale 'en' by default", () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current.locale).toBe("en");
    expect(typeof result.current.setLocale).toBe("function");
    expect(typeof result.current.t).toBe("function");
  });

  it("t('header.basePrices') returns English when locale is 'en'", () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current.t("header.basePrices")).toBe(
      "Base prices: Jul 2024",
    );
  });

  it("t('header.basePrices') returns Spanish when locale is 'es'", () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    act(() => {
      result.current.setLocale("es");
    });
    expect(result.current.t("header.basePrices")).toBe(
      "Precios base: Jul 2024",
    );
  });

  it("setLocale('es') updates locale and writes to localStorage", () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    act(() => {
      result.current.setLocale("es");
    });
    expect(result.current.locale).toBe("es");
    expect(localStorage.getItem("nelo-locale")).toBe("es");
  });

  it("reads 'nelo-locale' from localStorage on mount", () => {
    localStorage.setItem("nelo-locale", "es");
    const { result } = renderHook(() => useLocale(), { wrapper });
    // useEffect runs asynchronously, so the initial value may be 'en'
    // but after mount effect it should be 'es'
    expect(result.current.locale).toBe("es");
  });

  it("detects 'es' from navigator.language starting with 'es'", () => {
    Object.defineProperty(navigator, "language", {
      value: "es-AR",
      configurable: true,
    });
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current.locale).toBe("es");
    // Restore
    Object.defineProperty(navigator, "language", {
      value: "en-US",
      configurable: true,
    });
  });

  it("t() with missing key returns the key itself as fallback", () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current.t("nonexistent.key")).toBe("nonexistent.key");
  });
});
