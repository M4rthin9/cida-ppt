import { describe, expect, it } from "vitest";
import {
  frameName,
  frameUrl,
  isSequenceManifest,
  MAX_FRAMES,
  MIN_FRAMES,
  parsePattern,
  type SequenceManifest,
} from "./sequence";

const manifest: SequenceManifest = {
  base: "/frames/hero",
  count: 150,
  pattern: "frame-%03d.png",
  width: 1280,
  height: 720,
  version: "abc123",
};

describe("sequence manifest contract", () => {
  it("reads the padding and extension back out of the pattern", () => {
    expect(parsePattern("frame-%03d.png")).toEqual({ pad: 3, extension: "png" });
    expect(parsePattern("frame-%04d.jpg")).toEqual({ pad: 4, extension: "jpg" });
  });

  it("rejects a pattern that is not one the importer writes", () => {
    for (const pattern of [
      "frame-%d.png",
      "frame-%05d.png",
      "frame-%03d.gif",
      "../frame-%03d.png",
      "frame-%03d.png.exe",
      "",
    ])
      expect(parsePattern(pattern)).toBeUndefined();
  });

  it("names frames from one and pads them to the manifest's width", () => {
    expect(frameName("frame-%03d.png", 1)).toBe("frame-001.png");
    expect(frameName("frame-%03d.png", 150)).toBe("frame-150.png");
    expect(frameName("frame-%04d.jpg", 7)).toBe("frame-0007.jpg");
  });

  it("refuses a frame number that cannot name a file", () => {
    expect(frameName("frame-%03d.png", 0)).toBeUndefined();
    expect(frameName("frame-%03d.png", -1)).toBeUndefined();
    expect(frameName("frame-%03d.png", 1.5)).toBeUndefined();
  });

  it("builds a cache-keyed URL from the zero-based player index", () => {
    expect(frameUrl(manifest, 0)).toBe("/frames/hero/frame-001.png?v=abc123");
    expect(frameUrl(manifest, 149)).toBe("/frames/hero/frame-150.png?v=abc123");
  });

  it("escapes a version that would otherwise change the query string", () => {
    expect(frameUrl({ ...manifest, version: "a&b=c" }, 0)).toBe(
      "/frames/hero/frame-001.png?v=a%26b%3Dc",
    );
  });

  it("accepts a manifest the importer would write", () => {
    expect(isSequenceManifest({ ...manifest, count: MIN_FRAMES })).toBe(true);
    expect(isSequenceManifest({ ...manifest, count: MAX_FRAMES })).toBe(true);
  });

  it("rejects manifests that would leave the player painting nothing", () => {
    for (const bad of [
      null,
      "frame-%03d.png",
      { ...manifest, count: MIN_FRAMES - 1 },
      { ...manifest, count: MAX_FRAMES + 1 },
      { ...manifest, count: 12.5 },
      { ...manifest, pattern: "shot-%03d.png" },
      { ...manifest, width: 0 },
      { ...manifest, height: -720 },
    ])
      expect(isSequenceManifest(bad)).toBe(false);
  });
});
