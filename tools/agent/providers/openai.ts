/** OpenAI (or any OpenAI-compatible endpoint via OPENAI_BASE_URL). */
import { env } from "../config.ts";
import type { ChatMessage, GenerateOptions, Provider } from "./types.ts";

export const openai: Provider = {
  id: "openai",
  label: "OpenAI",
  defaultModel: env("OPENAI_MODEL", "gpt-4o-mini"),

  async isAvailable() {
    return Boolean(env("OPENAI_API_KEY"));
  },

  async listModels() {
    return [...new Set([this.defaultModel, "gpt-4o-mini", "gpt-4o"])];
  },

  async generate(messages: ChatMessage[], opts: GenerateOptions = {}) {
    const base = env("OPENAI_BASE_URL", "https://api.openai.com/v1").replace(/\/$/, "");
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: opts.model || this.defaultModel,
        messages,
        temperature: opts.temperature ?? 0.4,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!r.ok) throw new Error(`OpenAI error ${r.status}: ${await r.text()}`);
    const d = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return d.choices?.[0]?.message?.content ?? "";
  },
};
