/** Anthropic Claude (Messages API). Model is configurable via ANTHROPIC_MODEL. */
import { env } from "../config.ts";
import type { ChatMessage, GenerateOptions, Provider } from "./types.ts";

export const anthropic: Provider = {
  id: "anthropic",
  label: "Anthropic Claude",
  defaultModel: env("ANTHROPIC_MODEL", "claude-sonnet-4-6"),

  async isAvailable() {
    return Boolean(env("ANTHROPIC_API_KEY"));
  },

  async listModels() {
    return [...new Set([this.defaultModel, "claude-sonnet-4-6", "claude-haiku-4-5-20251001"])];
  },

  async generate(messages: ChatMessage[], opts: GenerateOptions = {}) {
    // Anthropic takes the system prompt as a top-level field, not a message.
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const msgs = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: opts.model || this.defaultModel,
        max_tokens: opts.maxTokens ?? 4096,
        temperature: opts.temperature ?? 0.4,
        system,
        messages: msgs,
      }),
    });
    if (!r.ok) throw new Error(`Anthropic error ${r.status}: ${await r.text()}`);
    const d = (await r.json()) as { content?: Array<{ text?: string }> };
    return (d.content ?? []).map((b) => b.text ?? "").join("");
  },
};
