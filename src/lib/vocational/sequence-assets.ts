import "server-only";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

/** Decide before sending HTML, so loading frames never changes the page height. */
export async function sequenceVersion(): Promise<string | undefined> {
  const directory = join(process.cwd(), "public", "frames");
  try {
    const [raw, entries, manifestStat] = await Promise.all([
      readFile(join(directory, "manifest.json"), "utf8"),
      readdir(directory, { withFileTypes: true }),
      stat(join(directory, "manifest.json")),
    ]);
    const manifest: unknown = JSON.parse(raw);
    if (
      !manifest ||
      typeof manifest !== "object" ||
      !("count" in manifest) ||
      manifest.count !== 150 ||
      !("pattern" in manifest) ||
      manifest.pattern !== "frame-%03d.png"
    )
      return undefined;
    const files = new Set(entries.filter((entry) => entry.isFile()).map((entry) => entry.name));
    for (let n = 1; n <= 150; n++) {
      if (!files.has(`frame-${String(n).padStart(3, "0")}.png`)) return undefined;
    }
    return "version" in manifest && typeof manifest.version === "string"
      ? manifest.version
      : Math.trunc(manifestStat.mtimeMs).toString(36);
  } catch {
    return undefined;
  }
}
