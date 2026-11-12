import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("applies defaults", () => {
    const env = parseEnv({});
    expect(env.NODE_ENV).toBe("development");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("rejects an invalid site url", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "not-a-url" })).toThrow(
      /Invalid environment variables/,
    );
  });
});
