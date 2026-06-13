/**
 * Roadside Japan agent CLI.
 *
 *   npm run agent -- providers
 *   npm run agent -- research "giant statues in Kyushu" [--provider anthropic] [--model ...] [--save]
 *
 * Without --save it prints proposals for review; with --save it writes them as
 * `approval: pending` entries for you to validate (`npm run data:validate`) and commit.
 */
import { loadEnv } from "./config.ts";
import { describeProviders, pickProvider } from "./providers/index.ts";
import { runResearch } from "./agents/research.ts";
import { writeEntry } from "./lib/entry.ts";

loadEnv();

const argv = process.argv.slice(2);
const cmd = argv[0];

function help() {
  console.log(`Roadside Japan — AI agent CLI

Commands:
  providers                       List providers and availability
  research "<query>" [flags]      Research candidate places for the atlas

Flags for research:
  --provider <id>   ollama | openai | anthropic | gemini  (default: first available)
  --model <name>    Override the model
  --save            Write candidates as pending entries (src/content/attractions/)

Examples:
  npm run agent -- providers
  npm run agent -- research "unusual festivals in Hokkaido"
  npm run agent -- research "giant statues in Kyushu" --provider anthropic --save
`);
}

async function main() {
  if (!cmd || cmd === "help" || cmd === "--help") return help();

  if (cmd === "providers") {
    for (const p of await describeProviders()) {
      console.log(
        `${p.available ? "✓" : "·"} ${p.id.padEnd(10)} ${p.label}` +
          (p.available ? `  [${p.models.join(", ")}]` : "  (unavailable)"),
      );
    }
    return;
  }

  if (cmd === "research") {
    let args = argv.slice(1);
    const opts: Record<string, string> = {};
    for (const name of ["provider", "model"]) {
      const i = args.indexOf(`--${name}`);
      if (i !== -1) {
        opts[name] = args[i + 1];
        args.splice(i, 2);
      }
    }
    const save = args.includes("--save");
    args = args.filter((a) => a !== "--save");
    const query = args.join(" ").trim();
    if (!query) return console.error('Provide a query, e.g. research "weird museums in Osaka"');

    const provider = await pickProvider(opts.provider);
    if (!provider) {
      console.error("No available provider. Add a key to .env or run Ollama locally.");
      process.exit(1);
    }
    console.log(`🔎 Researching with ${provider.label} (${opts.model || provider.defaultModel})…\n`);
    const result = await runResearch(provider, query, { model: opts.model });

    if (!result.candidates.length) {
      console.log("No candidates returned. Try rephrasing the query.");
      return;
    }

    result.candidates.forEach((c, i) => {
      const fm = c.frontmatter as Record<string, unknown>;
      console.log(`#${i + 1}  ${fm.title}   [${Math.round(c.confidence * 100)}% confidence]`);
      console.log(`    ${fm.summary}`);
      console.log(`    ${fm.category} · ${fm.prefecture}${fm.city ? ", " + fm.city : ""} · (${fm.lat}, ${fm.lng})`);
      if (c.reasoning) console.log(`    why: ${c.reasoning}`);
      c.warnings.forEach((w) => console.log(`    ⚠ ${w}`));
      c.sources.forEach((s) => console.log(`    ↳ ${s.title} — ${s.url}`));
      console.log("");
    });

    if (save) {
      for (const c of result.candidates) {
        const { relPath } = writeEntry("attractions", c.slug, c.markdown);
        console.log(`💾 saved ${relPath}`);
      }
      console.log("\nNext: `npm run data:validate` to check the schema, then review and commit.");
    } else {
      console.log("Re-run with --save to write these as pending entries for review.");
    }
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  help();
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
