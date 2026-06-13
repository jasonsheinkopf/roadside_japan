# AI Agents

Roadside Japan is built to be curated with AI. The tooling lives in `tools/agent/` and is a
**local** developer tool: it talks to an LLM, drafts schema-valid entries, and writes them to
the repo for human approval. Keys and compute stay on your machine; the public site stays
static.

## The workflow

```
You chat / run CLI  →  Research Agent  →  proposes schema-valid entries (sources + confidence)
                                              │
                                     You review & approve
                                              │
                       entry written to src/content/ as `approval: pending`
                                              │
                       you validate, edit, set `published`, commit / PR
                                              │
                                   site rebuilds → live
```

## Setup

```bash
cp .env.example .env     # add a key, or just run Ollama (local, free)
npm run agent -- providers
```

Supported providers (one abstraction, `tools/agent/providers/`):

| Provider  | Env | Notes |
| --------- | --- | ----- |
| Ollama    | `OLLAMA_HOST`, `OLLAMA_MODEL` | Local & free; auto-detected if running. |
| OpenAI    | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL?` | Also any OpenAI-compatible API. |
| Anthropic | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Claude Messages API. |
| Gemini    | `GEMINI_API_KEY`, `GEMINI_MODEL` | Google Generative Language API. |

Provider selection: `--provider` flag → `RJ_PROVIDER` env → first available (Ollama first).

## CLI

```bash
npm run agent -- research "unusual festivals in Hokkaido"
npm run agent -- research "giant statues in Kyushu" --provider anthropic --model claude-sonnet-4-6
npm run agent -- research "weird museums in Osaka" --save     # write as pending entries
```

`--save` writes each candidate to `src/content/attractions/<slug>.md` with
`approval: pending`, `source: ai-agent`. Then:

```bash
npm run data:validate   # schema check
# review/edit the files, set approval: published when satisfied
npm run build
```

## Chat UI (`/admin`)

```bash
npm run agent:server    # starts the local API on :8787
npm run dev             # open the site, go to /admin, click "Connect"
```

The chat lets you research, see candidate cards (title, confidence, sources, full file
preview), and **Approve → queue** (POST `/api/save`). Because the deployed site can't reach
`localhost`, the chat is a local-development workflow — the public `/admin` page explains this
and still shows the live review queue and moderation links.

## How a candidate becomes valid data

`tools/agent/agents/research.ts` injects the controlled vocabulary (categories, seasons,
prefecture slugs, example tags from `src/data/*`) into the prompt
(`research-prompt.ts`), so the model emits legal values. It parses strict JSON, normalizes it
into full frontmatter (defaults, provenance, timestamps, confidence), coerces obvious
mistakes (e.g. unknown category → `oddity`, with a `warning`), and renders Markdown via
`lib/entry.ts` + `lib/yaml.ts`. The **real** validation gate is still `astro sync`/`build`.

## Add a provider

Implement `Provider` (`tools/agent/providers/types.ts`) in a new file and register it in
`providers/index.ts`. The CLI, server, and admin UI pick it up automatically.

```ts
export const myProvider: Provider = {
  id: "myco", label: "MyCo", defaultModel: env("MYCO_MODEL", "default"),
  async isAvailable() { return Boolean(env("MYCO_API_KEY")); },
  async listModels() { return [this.defaultModel]; },
  async generate(messages, opts) { /* fetch the API, return assistant text */ return ""; },
};
```

## Future agents (anticipated)

The architecture (shared providers + `lib/entry.ts` + the `*-prompt.ts` pattern) is built to
grow into a small crew. Each is a new `tools/agent/agents/<name>.ts`:

- **Photo Agent** — find/attach openly-licensed images + credits.
- **Fact-Checker** — verify claims, coordinates, and hours against sources; adjust confidence.
- **Duplicate Detector** — flag near-duplicates before save (geo + title + embedding).
- **Translator** — add Japanese (and other) localizations.
- **SEO Agent** — refine summaries, keywords, and structured data.
- **Moderation Agent** — triage submissions/comments in the queue.
- **Map Agent** — sanity-check coordinates and enrich transit/parking.

See `docs/ROADMAP.md` for sequencing.

## Safety & provenance

- AI entries are always `pending` and carry `source: ai-agent`, `confidence`, and `sources`.
- Nothing is published without a human flipping `approval: published`.
- The build schema is the last line of defense — malformed AI output cannot reach the site.
