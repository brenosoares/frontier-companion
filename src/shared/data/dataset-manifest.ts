import manifestJson from "../../../data/processed/manifest.json";
import { DatasetManifestSchema } from "../domain/dataset-manifest";

/** Bundled at build time (no runtime I/O) and validated, so a bad manifest fails the build. */
export const datasetManifest = DatasetManifestSchema.parse(manifestJson);
