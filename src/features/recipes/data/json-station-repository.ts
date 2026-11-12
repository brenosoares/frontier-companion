import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import { type Station, StationSchema } from "../domain/station";
import type { StationRepository } from "../domain/station-repository";

export class JsonStationRepository implements StationRepository {
  private readonly stations: JsonCollection<Station>;

  constructor(load: JsonLoader) {
    this.stations = new JsonCollection(StationSchema, load, "stations");
  }

  getAll(): Promise<readonly Station[]> {
    return this.stations.all();
  }

  getById(id: string): Promise<Station | null> {
    return this.stations.byId(id);
  }
}
