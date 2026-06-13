/**
 * config.ts — environment + paths for the AI agent toolchain.
 *
 * Loads a local .env (no dependency on dotenv) so provider API keys never need to be
 * exported manually. Existing process.env values always win. Keys live ONLY on the
 * developer's machine — .env is gitignored. See .env.example and docs/AI_AGENTS.md.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function loadEnv(): void {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

export function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}
