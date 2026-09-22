import { describe, it, expect } from "vitest";
import { authConfig } from "./config";
describe("authentication claim trust", () => {
  it("does not accept client role or session-version changes", () => {
    const callback = authConfig.callbacks.jwt;
    const input = {
      token: { uid: "editor-id", role: "editor", sessionVersion: 1 },
      trigger: "update",
      session: { role: "owner", sessionVersion: 99 },
    } as Parameters<typeof callback>[0];
    expect(callback(input)).toMatchObject({ uid: "editor-id", role: "editor", sessionVersion: 1 });
  });
});
