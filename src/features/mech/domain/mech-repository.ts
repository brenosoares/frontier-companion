import type { MechChip, MechPart, MechStat } from "./mech";

export interface MechRepository {
  getStats(): Promise<readonly MechStat[]>;
  getParts(): Promise<readonly MechPart[]>;
  getPartById(id: string): Promise<MechPart | null>;
  getChips(): Promise<readonly MechChip[]>;
  getChipById(id: string): Promise<MechChip | null>;
}
