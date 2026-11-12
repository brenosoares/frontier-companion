import { z } from "zod";

export interface Identifiable {
  id: string;
}

export type JsonLoader = () => Promise<unknown>;

/**
 * Lazily loads, validates (Zod) and caches an array of entities keyed by `id`.
 * Anything read from disk is treated as untrusted until it passes the schema.
 */
export class JsonCollection<T extends Identifiable> {
  private cache: Promise<ReadonlyMap<string, T>> | undefined;

  constructor(
    private readonly schema: z.ZodType<T>,
    private readonly load: JsonLoader,
    private readonly label: string,
  ) {}

  async all(): Promise<readonly T[]> {
    return [...(await this.index()).values()];
  }

  async byId(id: string): Promise<T | null> {
    return (await this.index()).get(id) ?? null;
  }

  private index(): Promise<ReadonlyMap<string, T>> {
    this.cache ??= this.read();
    return this.cache;
  }

  private async read(): Promise<ReadonlyMap<string, T>> {
    const parsed = z.array(this.schema).safeParse(await this.load());
    if (!parsed.success) {
      throw new Error(`Invalid ${this.label} data\n${z.prettifyError(parsed.error)}`);
    }
    return new Map(parsed.data.map((entity) => [entity.id, entity]));
  }
}
