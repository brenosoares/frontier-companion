import { readFile } from "node:fs/promises";
import path from "node:path";
import type { JsonLoader } from "./json-collection";

const PROCESSED_DIR = path.join(process.cwd(), "data", "processed");

/** Server-only loader for pipeline output (`pnpm data:build`). Never import from client components. */
export function processedJson(fileName: `${string}.json`): JsonLoader {
  return async () => JSON.parse(await readFile(path.join(PROCESSED_DIR, fileName), "utf-8"));
}
