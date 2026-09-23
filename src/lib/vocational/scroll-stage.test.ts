import { describe, expect, it } from "vitest";
import { band, remap, scrollProgress } from "./scroll-stage";
import { frameAt, landmarksFor } from "./scroll-player";

describe("stage progress", () => {
  it("is 0 while the stage is pinning and 1 once the section has passed", () => {
    // A 400px section holding a 100px stage scrubs over 300px of scrolling.
    expect(scrollProgress(0, 400, 100)).toBe(0);
    expect(scrollProgress(-150, 400, 100)).toBeCloseTo(0.5);
    expect(scrollProgress(-300, 400, 100)).toBe(1);
  });

  it("clamps rather than running past either end", () => {
    expect(scrollProgress(120, 400, 100)).toBe(0);
    expect(scrollProgress(-900, 400, 100)).toBe(1);
  });

  it("survives a section no taller than its own stage", () => {
    expect(scrollProgress(-50, 100, 100)).toBe(1);
    expect(scrollProgress(0, 0, 0)).toBe(0);
  });
});

describe("remap", () => {
  it("rescales a slice of the range to a full 0-1", () => {
    expect(remap(0.8, 0.8, 1)).toBe(0);
    expect(remap(0.9, 0.8, 1)).toBeCloseTo(0.5);
    expect(remap(1, 0.8, 1)).toBe(1);
  });

  it("clamps outside its slice", () => {
    expect(remap(0.1, 0.8, 1)).toBe(0);
    expect(remap(2, 0.8, 1)).toBe(1);
  });

  it("degrades to a step when the slice has no width", () => {
    expect(remap(0.4, 0.5, 0.5)).toBe(0);
    expect(remap(0.5, 0.5, 0.5)).toBe(1);
  });
});

describe("band", () => {
  it("holds at 1 between its feathered edges and is 0 outside them", () => {
    expect(band(0.1, 0.24, 0.4)).toBe(0);
    expect(band(0.32, 0.24, 0.4)).toBe(1);
    expect(band(0.5, 0.24, 0.4)).toBe(0);
  });

  it("feathers in and out rather than cutting", () => {
    expect(band(0.24 + 0.035 / 2, 0.24, 0.4)).toBeCloseTo(0.5);
    expect(band(0.4 - 0.035 / 2, 0.24, 0.4)).toBeCloseTo(0.5);
  });

  it("keeps the hero's three captions off each other's stretch", () => {
    // The whole point of the score: at no scroll position do two clauses of
    // the lede both have a presence on screen.
    const windows: [number, number][] = [
      [0.24, 0.4],
      [0.42, 0.58],
      [0.6, 0.74],
    ];
    for (let p = 0; p <= 1; p += 0.005) {
      const lit = windows.filter(([a, b]) => band(p, a, b) > 0);
      expect(lit.length).toBeLessThanOrEqual(1);
    }
  });
});

describe("frame selection", () => {
  it("spans the whole sequence, whatever its length", () => {
    expect(frameAt(0, 150)).toBe(0);
    expect(frameAt(1, 150)).toBe(149);
    expect(frameAt(0.5, 101)).toBe(50);
    expect(frameAt(1, 24)).toBe(23);
  });

  it("clamps out-of-range progress and handles a degenerate sequence", () => {
    expect(frameAt(-1, 150)).toBe(0);
    expect(frameAt(2, 150)).toBe(149);
    expect(frameAt(0.5, 1)).toBe(0);
    expect(frameAt(0.5, 0)).toBe(0);
  });

  it("anchors preloading at both ends and across the middle", () => {
    expect(landmarksFor(150)).toEqual([0, 149, 37, 75, 112]);
    // Short sequences must not produce duplicate or out-of-range anchors.
    const short = landmarksFor(8);
    expect(new Set(short).size).toBe(short.length);
    expect(short.every((frame) => frame >= 0 && frame < 8)).toBe(true);
  });
});
