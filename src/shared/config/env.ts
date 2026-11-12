import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

/** Pure and injectable so it can be tested without touching process.env. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = z.prettifyError(result.error);
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return result.data;
}

export const env = parseEnv({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
