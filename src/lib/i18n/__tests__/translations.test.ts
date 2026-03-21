import { describe, it, expect } from "vitest";
import { translations } from "../translations";
import type { Locale } from "../types";

describe("translations", () => {
  it("en and es have identical key sets", () => {
    const enKeys = Object.keys(translations.en).sort();
    const esKeys = Object.keys(translations.es).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it("every translation value is a non-empty string", () => {
    for (const locale of ["en", "es"] as Locale[]) {
      for (const [key, value] of Object.entries(translations[locale])) {
        expect(typeof value).toBe("string");
        expect(value.length, `${locale}.${key} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it("Locale type is 'en' | 'es'", () => {
    const locales = Object.keys(translations);
    expect(locales).toContain("en");
    expect(locales).toContain("es");
    expect(locales).toHaveLength(2);
  });

  it("translations object is typed as Record<Locale, Translations>", () => {
    // Runtime type check: both locales exist and are objects
    expect(typeof translations.en).toBe("object");
    expect(typeof translations.es).toBe("object");
  });

  it("has correct header translations", () => {
    expect(translations.en["header.basePrices"]).toBe("Base prices: Jul 2024");
    expect(translations.es["header.basePrices"]).toBe("Precios base: Jul 2024");
  });

  it("has correct landing translations", () => {
    expect(translations.en["landing.greeting"]).toBe("Hi, I'm Nelo");
    expect(translations.es["landing.greeting"]).toBe("Hola, soy Nelo");
  });

  it("has all category keys", () => {
    const categoryKeys = Object.keys(translations.en).filter((k) =>
      k.startsWith("category."),
    );
    // 26 categories from categories-config.ts
    expect(categoryKeys.length).toBe(26);
  });

  it("has all express question keys", () => {
    const questionKeys = Object.keys(translations.en).filter((k) =>
      k.startsWith("expressQuestion."),
    );
    expect(questionKeys.length).toBe(6);
  });

  it("has all engine assumption keys", () => {
    expect(translations.en["engine.assumptionCeilingHeight"]).toBe(
      "Floor-to-ceiling height",
    );
    expect(translations.es["engine.assumptionCeilingHeight"]).toBe(
      "Altura de piso a techo",
    );
  });
});
