/**
 * The contract shared by the frame importer, the server-side manifest reader and
 * the browser player. Everything about a sequence — how many frames there are,
 * what they are called and where they live — travels in the manifest, so the
 * homepage can drive two independent sequences (the hero and the reveal) of
 * different lengths without a code change when the frames are replaced.
 */

/** The named sets the site renders. Anything else on disk is ignored. */
export const SEQUENCE_SETS = ["hero", "reveal"] as const;

export type SequenceSet = (typeof SEQUENCE_SETS)[number];

export type SequenceManifest = {
  /** Public URL prefix, without a trailing slash: `/frames` or `/frames/reveal`. */
  base: string;
  count: number;
  /** `frame-%03d.png`; the padding and extension are read back out of it. */
  pattern: string;
  width: number;
  height: number;
  /** Cache key; changes whenever the frame bytes change. */
  version: string;
};

/**
 * A sequence has to be long enough to read as motion and short enough to stay
 * within the player's memory budget on a phone. The importer subsamples above
 * the ceiling rather than refusing the folder.
 */
export const MIN_FRAMES = 8;
export const MAX_FRAMES = 600;

const PATTERN = /^frame-%0([2-4])d\.(png|jpg)$/;

export function parsePattern(pattern: string): { pad: number; extension: string } | undefined {
  const match = PATTERN.exec(pattern);
  const [, pad, extension] = match ?? [];
  return pad && extension ? { pad: Number(pad), extension } : undefined;
}

/** One-based, matching the file names the importer writes. */
export function frameName(pattern: string, frame: number): string | undefined {
  const parsed = parsePattern(pattern);
  if (!parsed || !Number.isInteger(frame) || frame < 1) return undefined;
  return `frame-${String(frame).padStart(parsed.pad, "0")}.${parsed.extension}`;
}

/** Zero-based, matching the player's internal indexing. */
export function frameUrl(manifest: SequenceManifest, index: number): string | undefined {
  const name = frameName(manifest.pattern, index + 1);
  return name ? `${manifest.base}/${name}?v=${encodeURIComponent(manifest.version)}` : undefined;
}

/** Narrows whatever `JSON.parse` returned; the manifest is generated, but it is still input. */
export function isSequenceManifest(value: unknown): value is SequenceManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Record<string, unknown>;
  return (
    typeof manifest.pattern === "string" &&
    parsePattern(manifest.pattern) !== undefined &&
    typeof manifest.count === "number" &&
    Number.isInteger(manifest.count) &&
    manifest.count >= MIN_FRAMES &&
    manifest.count <= MAX_FRAMES &&
    typeof manifest.width === "number" &&
    manifest.width > 0 &&
    typeof manifest.height === "number" &&
    manifest.height > 0
  );
}
