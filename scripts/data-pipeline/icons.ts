import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

/** Names (without extension) of the PNG icons in a directory. */
export async function listIconNames(directory: string): Promise<Set<string>> {
  const files = await readdir(directory);
  return new Set(
    files
      .filter((file) => file.toLowerCase().endsWith(".png"))
      .map((file) => path.parse(file).name),
  );
}

/**
 * Publishes only the icons that are actually used. `destDir` is generated output and is rebuilt
 * from scratch, so icons of removed content never linger. Returns how many files were copied.
 */
export async function copyIcons(
  icons: readonly (string | null)[],
  sourceDir: string,
  destDir: string,
): Promise<number> {
  const names = new Set(icons.flatMap((icon) => (icon ? [icon] : [])));

  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
  await Promise.all(
    [...names].map((name) =>
      copyFile(path.join(sourceDir, `${name}.png`), path.join(destDir, `${name}.png`)),
    ),
  );
  return names.size;
}
