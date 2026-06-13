/** Provider registry + detection. Multi-agent future: agents share this same registry. */
import type { Provider } from "./types.ts";
import { ollama } from "./ollama.ts";
import { openai } from "./openai.ts";
import { anthropic } from "./anthropic.ts";
import { gemini } from "./gemini.ts";

export const PROVIDERS: Provider[] = [ollama, openai, anthropic, gemini];

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export interface ProviderInfo {
  id: string;
  label: string;
  available: boolean;
  models: string[];
  default: string;
}

/** Describe every provider (availability + models) — used by the admin UI and CLI. */
export async function describeProviders(): Promise<ProviderInfo[]> {
  return Promise.all(
    PROVIDERS.map(async (p) => ({
      id: p.id,
      label: p.label,
      available: await p.isAvailable(),
      models: await p.listModels(),
      default: p.defaultModel,
    })),
  );
}

/** First available provider, preferring an explicit RJ_PROVIDER env, else local Ollama. */
export async function pickProvider(preferId?: string): Promise<Provider | undefined> {
  if (preferId) {
    const p = getProvider(preferId);
    if (p && (await p.isAvailable())) return p;
  }
  const envPref = process.env.RJ_PROVIDER;
  if (envPref) {
    const p = getProvider(envPref);
    if (p && (await p.isAvailable())) return p;
  }
  for (const p of PROVIDERS) {
    if (await p.isAvailable()) return p;
  }
  return undefined;
}
