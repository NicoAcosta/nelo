import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../system-prompt-builder";
import { CATEGORIES, EXPRESS_QUESTIONS } from "../categories-config";

describe("buildSystemPrompt", () => {
  it("returns English prompt containing 'You are Nelo' for locale 'en'", () => {
    const prompt = buildSystemPrompt("consumer", "en");
    expect(prompt).toContain("You are Nelo");
  });

  it("returns Spanish prompt containing 'Sos Nelo' for locale 'es'", () => {
    const prompt = buildSystemPrompt("consumer", "es");
    expect(prompt).toContain("Sos Nelo");
  });

  it("returns English professional instructions for locale 'en'", () => {
    const prompt = buildSystemPrompt("professional", "en");
    expect(prompt).toContain("PROFESSIONAL");
  });

  it("defaults to 'en' when no locale passed", () => {
    const prompt = buildSystemPrompt("consumer");
    expect(prompt).toContain("You are Nelo");
    expect(prompt).not.toContain("Sos Nelo");
  });

  it("uses English category names in prompt when locale is 'en'", () => {
    const prompt = buildSystemPrompt("consumer", "en");
    expect(prompt).toContain("Preliminary Work");
    expect(prompt).not.toContain("Trabajos Preliminares");
  });

  it("uses Spanish category names in prompt when locale is 'es'", () => {
    const prompt = buildSystemPrompt("consumer", "es");
    expect(prompt).toContain("Trabajos Preliminares");
  });

  it("uses English express question labels when locale is 'en'", () => {
    const prompt = buildSystemPrompt("consumer", "en");
    expect(prompt).toContain("How many square meters");
  });

  it("uses Spanish express question labels when locale is 'es'", () => {
    const prompt = buildSystemPrompt("consumer", "es");
    expect(prompt).toContain("metros cuadrados");
  });
});

describe("CATEGORIES bilingual fields", () => {
  it("every CategoryConfig has a nameEn field", () => {
    for (const cat of CATEGORIES) {
      expect(cat).toHaveProperty("nameEn");
      expect(typeof (cat as any).nameEn).toBe("string");
      expect((cat as any).nameEn.length).toBeGreaterThan(0);
    }
  });

  it("has exactly 26 categories with nameEn", () => {
    const withNameEn = CATEGORIES.filter((c) => "nameEn" in c);
    expect(withNameEn.length).toBe(26);
  });
});

describe("EXPRESS_QUESTIONS bilingual fields", () => {
  it("every question has a labelEn field", () => {
    for (const q of EXPRESS_QUESTIONS) {
      expect(q).toHaveProperty("labelEn");
      expect(typeof (q as any).labelEn).toBe("string");
      expect((q as any).labelEn.length).toBeGreaterThan(0);
    }
  });

  it("has exactly 6 questions with labelEn", () => {
    const withLabelEn = EXPRESS_QUESTIONS.filter((q) => "labelEn" in q);
    expect(withLabelEn.length).toBe(6);
  });
});
