// @vitest-environment node
import { describe, expect, it } from "vitest";
import { findSensitiveStrings } from "./sanitize";

describe("findSensitiveStrings", () => {
  it.each([
    ["windows-path", "C:\\Users\\someone\\game"],
    ["windows-path", "D:/builds/x"],
    ["unix-home-path", "/home/dev/project"],
    ["email", "contact@studio.example"],
    ["url", "see https://studio.example/terms"],
  ])("detects %s in %j", (kind, value) => {
    expect(findSensitiveStrings({ text: value })).toEqual([
      { path: "$.text", kind, sample: value },
    ]);
  });

  it("reports the full path inside nested structures", () => {
    const findings = findSensitiveStrings({ list: [{ a: "ok" }, { a: "me@x.io" }] });
    expect(findings.map((f) => f.path)).toEqual(["$.list[1].a"]);
  });

  it("ignores harmless text and non-strings", () => {
    expect(findSensitiveStrings({ a: "Rabberry Oil", n: 3, b: true, c: null })).toEqual([]);
  });
});
