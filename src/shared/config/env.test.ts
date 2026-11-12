import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("applies defaults", () => {
    const env = parseEnv({});
    expect(env.NODE_ENV).toBe("development");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("treats the support url as optional but validates it when present", () => {
    expect(parseEnv({}).NEXT_PUBLIC_BMC_URL).toBeUndefined();
    expect(
      parseEnv({ NEXT_PUBLIC_BMC_URL: "https://buymeacoffee.com/x" }).NEXT_PUBLIC_BMC_URL,
    ).toBe("https://buymeacoffee.com/x");
    expect(() => parseEnv({ NEXT_PUBLIC_BMC_URL: "nope" })).toThrow(
      /Invalid environment variables/,
    );
  });

  it("rejects an invalid site url", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "not-a-url" })).toThrow(
      /Invalid environment variables/,
    );
  });
});
