/** Google Gemini (Generative Language API). Model via GEMINI_MODEL. */
import { env } from "../config.ts";
import type { ChatMessage, GenerateOptions, Provider } from "./types.ts";

export const gemini: Provider = {
  id: "gemini",
  label: "Google Gemini",
  defaultModel: env("GEMINI_MODEL", "gemini-2.0-flash"),

  async isAvailable() {
    return Boolean(env("GEMINI_API_KEY"));
  },

  async listModels() {
    return [...new Set([this.defaultModel, "gemini-2.0-flash", "gemini-1.5-pro"])];
  },

  async generate(messages: ChatMessage[], opts: GenerateOptions = {}) {
    const key = env("GEMINI_API_KEY");
    const model = opts.model || this.defaultModel;
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

    const body: Record<string, unknown> = {
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    };

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    if (!r.ok) throw new Error(`Gemini error ${r.status}: ${await r.text()}`);
    const d = (await r.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return (d.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  },
};
