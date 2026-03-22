import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { LocaleProvider, detectInitialLocale } from "../context";
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

  it("defaults to English even when navigator.language is Spanish", () => {
    Object.defineProperty(navigator, "language", {
      value: "es-AR",
      configurable: true,
    });
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current.locale).toBe("en");
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

describe("detectInitialLocale", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns 'en' when no localStorage preference exists", () => {
    expect(detectInitialLocale()).toBe("en");
  });

  it("returns 'es' when localStorage has 'es'", () => {
    localStorage.setItem("nelo-locale", "es");
    expect(detectInitialLocale()).toBe("es");
  });

  it("returns 'en' when localStorage has 'en'", () => {
    localStorage.setItem("nelo-locale", "en");
    expect(detectInitialLocale()).toBe("en");
  });

  it("returns 'en' when localStorage has invalid value", () => {
    localStorage.setItem("nelo-locale", "fr");
    expect(detectInitialLocale()).toBe("en");
  });

  it("ignores navigator.language and defaults to English", () => {
    Object.defineProperty(navigator, "language", {
      value: "es-AR",
      configurable: true,
    });
    expect(detectInitialLocale()).toBe("en");
    Object.defineProperty(navigator, "language", {
      value: "en-US",
      configurable: true,
    });
  });
});
