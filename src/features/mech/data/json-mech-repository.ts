import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import {
  type MechChip,
  MechChipSchema,
  type MechPart,
  MechPartSchema,
  type MechStat,
  MechStatSchema,
} from "../domain/mech";
import type { MechRepository } from "../domain/mech-repository";

interface MechLoaders {
  stats: JsonLoader;
  parts: JsonLoader;
  chips: JsonLoader;
}

export class JsonMechRepository implements MechRepository {
  private readonly stats: JsonCollection<MechStat>;
  private readonly parts: JsonCollection<MechPart>;
  private readonly chips: JsonCollection<MechChip>;

  constructor(loaders: MechLoaders) {
    this.stats = new JsonCollection(MechStatSchema, loaders.stats, "mech-stats");
    this.parts = new JsonCollection(MechPartSchema, loaders.parts, "mech-parts");
    this.chips = new JsonCollection(MechChipSchema, loaders.chips, "mech-chips");
  }

  getStats(): Promise<readonly MechStat[]> {
    return this.stats.all();
  }

  getParts(): Promise<readonly MechPart[]> {
    return this.parts.all();
  }

  getPartById(id: string): Promise<MechPart | null> {
    return this.parts.byId(id);
  }

  getChips(): Promise<readonly MechChip[]> {
    return this.chips.all();
  }

  getChipById(id: string): Promise<MechChip | null> {
    return this.chips.byId(id);
  }
}
