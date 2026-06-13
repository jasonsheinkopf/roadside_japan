/** Ollama — local, free, private. Auto-detected if the daemon is running. */
import { env } from "../config.ts";
import type { ChatMessage, GenerateOptions, Provider } from "./types.ts";

const host = () => env("OLLAMA_HOST", "http://localhost:11434").replace(/\/$/, "");

export const ollama: Provider = {
  id: "ollama",
  label: "Ollama (local)",
  defaultModel: env("OLLAMA_MODEL", "llama3.1"),

  async isAvailable() {
    try {
      const r = await fetch(`${host()}/api/tags`, { signal: AbortSignal.timeout(800) });
      return r.ok;
    } catch {
      return false;
    }
  },

  async listModels() {
    try {
      const r = await fetch(`${host()}/api/tags`);
      const d = (await r.json()) as { models?: Array<{ name: string }> };
      const names = (d.models ?? []).map((m) => m.name);
      return names.length ? names : [this.defaultModel];
    } catch {
      return [this.defaultModel];
    }
  },

  async generate(messages: ChatMessage[], opts: GenerateOptions = {}) {
    const r = await fetch(`${host()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: opts.model || this.defaultModel,
        messages,
        stream: false,
        format: opts.json ? "json" : undefined,
        options: { temperature: opts.temperature ?? 0.4 },
      }),
    });
    if (!r.ok) throw new Error(`Ollama error ${r.status}: ${await r.text()}`);
    const d = (await r.json()) as { message?: { content?: string } };
    return d.message?.content ?? "";
  },
};
