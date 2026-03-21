/**
 * Nelo — Model Configuration
 *
 * Centralized model config using OpenRouter.
 * Change model strings here to switch providers/models globally.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/** Primary model for chat + tool calling */
export const chatModel = openrouter("anthropic/claude-sonnet-4");

/** Model for floor plan vision analysis (same model, vision-capable) */
export const visionModel = openrouter("anthropic/claude-sonnet-4");
