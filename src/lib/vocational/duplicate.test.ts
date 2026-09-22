import { describe, expect, it } from "vitest";
import { duplicateProductName } from "./duplicate";

describe("product duplication", () => {
  it("keeps optional untranslated names blank", () => {
    expect(duplicateProductName("")).toBe("");
  });

  it("identifies copies without exceeding the database name limit", () => {
    expect(duplicateProductName("ผลงานฝึกวิชาชีพ")).toBe("ผลงานฝึกวิชาชีพ (สำเนา)");
    const result = duplicateProductName("ก".repeat(255));
    expect(result).toHaveLength(255);
    expect(result.endsWith(" (สำเนา)")).toBe(true);
  });
});
