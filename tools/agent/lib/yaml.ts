/**
 * Minimal, dependency-free YAML emitter for writing content frontmatter.
 * Handles the shapes our schema uses: scalars, arrays of scalars, arrays of objects
 * (photos/sources), and nested objects (cost/parking/transit/accessibility).
 * Strings are emitted as JSON-quoted scalars, which are valid YAML and safely escaped.
 */
type Json = string | number | boolean | Date | null | Json[] | { [k: string]: Json | undefined };

function isPlainObject(v: unknown): v is Record<string, Json> {
  return !!v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);
}

function scalar(v: Json): string {
  if (v instanceof Date) return JSON.stringify(v.toISOString().slice(0, 10));
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}

function emit(obj: Record<string, Json | undefined>, indent = 0): string {
  const pad = "  ".repeat(indent);
  let out = "";
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) {
        out += `${pad}${k}: []\n`;
        continue;
      }
      out += `${pad}${k}:\n`;
      for (const item of v) {
        if (isPlainObject(item)) {
          const entries = Object.entries(item).filter(([, vv]) => vv !== undefined) as [string, Json][];
          entries.forEach(([ik, iv], i) => {
            out += i === 0 ? `${pad}  - ${ik}: ${scalar(iv)}\n` : `${pad}    ${ik}: ${scalar(iv)}\n`;
          });
        } else {
          out += `${pad}  - ${scalar(item as Json)}\n`;
        }
      }
    } else if (isPlainObject(v)) {
      out += `${pad}${k}:\n${emit(v, indent + 1)}`;
    } else {
      out += `${pad}${k}: ${scalar(v)}\n`;
    }
  }
  return out;
}

export function toYaml(obj: Record<string, Json | undefined>): string {
  return emit(obj);
}
