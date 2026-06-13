/**
 * Local agent server — the backend for the in-browser admin chat (/admin).
 *
 *   npm run agent:server   # → http://localhost:8787
 *
 * Endpoints (all JSON, permissive CORS so the local dev site can call it):
 *   GET  /api/health    → providers, availability, models, default
 *   POST /api/research  → { query, provider?, model? } → research candidates
 *   POST /api/save      → { candidate, approval? }     → writes a content file
 *
 * This binds to localhost and is a developer tool: keys stay on your machine and nothing
 * here is exposed by the static site. See docs/AI_AGENTS.md.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadEnv, env } from "./config.ts";
import { describeProviders, pickProvider } from "./providers/index.ts";
import { runResearch } from "./agents/research.ts";
import { buildMarkdown, writeEntry, type Collection } from "./lib/entry.ts";

loadEnv();
const PORT = Number(env("AGENT_PORT", "8787"));

function cors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function json(res: ServerResponse, code: number, obj: unknown) {
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}
function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      try {
        resolve(b ? JSON.parse(b) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    return res.end();
  }
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      const providers = await describeProviders();
      const def = await pickProvider();
      return json(res, 200, {
        ok: true,
        providers,
        default: def ? { provider: def.id, model: def.defaultModel } : null,
      });
    }

    if (req.method === "POST" && url.pathname === "/api/research") {
      const body = await readBody(req);
      const query = String(body.query ?? "");
      if (!query) return json(res, 400, { error: "query required" });
      const provider = await pickProvider(body.provider as string | undefined);
      if (!provider) return json(res, 400, { error: "no available provider" });
      const result = await runResearch(provider, query, { model: body.model as string | undefined });
      return json(res, 200, result);
    }

    if (req.method === "POST" && url.pathname === "/api/save") {
      const body = await readBody(req);
      const candidate = body.candidate as
        | { collection?: Collection; slug?: string; frontmatter?: Record<string, unknown>; body?: string }
        | undefined;
      if (!candidate?.frontmatter) return json(res, 400, { error: "candidate.frontmatter required" });
      const frontmatter = { ...candidate.frontmatter, approval: (body.approval as string) || "pending" };
      const md = buildMarkdown(frontmatter, candidate.body ?? "");
      const { relPath } = writeEntry(candidate.collection ?? "attractions", candidate.slug ?? "untitled", md);
      return json(res, 200, { ok: true, path: relPath });
    }

    json(res, 404, { error: "not found" });
  } catch (e) {
    json(res, 500, { error: e instanceof Error ? e.message : String(e) });
  }
});

server.listen(PORT, () => {
  console.log(`🤖 Roadside Japan agent server → http://localhost:${PORT}`);
  console.log("   GET /api/health · POST /api/research · POST /api/save");
});
