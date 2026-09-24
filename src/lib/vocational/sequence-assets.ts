import "server-only";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { frameName, isSequenceManifest, type SequenceManifest, type SequenceSet } from "./sequence";

async function read(relative: string): Promise<SequenceManifest | undefined> {
  const directory = join(process.cwd(), "public", relative);
  try {
    const [raw, entries, manifestStat] = await Promise.all([
      readFile(join(directory, "manifest.json"), "utf8"),
      readdir(directory, { withFileTypes: true }),
      stat(join(directory, "manifest.json")),
    ]);
    const parsed: unknown = JSON.parse(raw);
    if (!isSequenceManifest(parsed)) return undefined;
    const files = new Set(entries.filter((entry) => entry.isFile()).map((entry) => entry.name));
    for (let frame = 1; frame <= parsed.count; frame++) {
      const name = frameName(parsed.pattern, frame);
      if (!name || !files.has(name)) return undefined;
    }
    return {
      base: `/${relative}`,
      count: parsed.count,
      pattern: parsed.pattern,
      width: parsed.width,
      height: parsed.height,
      version:
        typeof parsed.version === "string" && parsed.version
          ? parsed.version
          : Math.trunc(manifestStat.mtimeMs).toString(36),
    };
  } catch {
    return undefined;
  }
}

/**
 * Resolve a sequence before any HTML is sent, so a missing or half-imported set
 * renders the static composition instead of collapsing the page height once the
 * player gives up in the browser.
 */
export function readSequence(set: SequenceSet): Promise<SequenceManifest | undefined> {
  return read(`frames/${set}`);
}
