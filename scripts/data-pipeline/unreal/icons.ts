import { assetStem } from "./normalize";

/** `T_Foo` / `t_Foo` -> `Foo`. The icon-set script only strips an upper-case prefix. */
const stripPrefix = (name: string) => name.replace(/^t_/i, "");

type IconIndex = ReadonlyMap<string, string>;

const indexCache = new WeakMap<ReadonlySet<string>, IconIndex>();

/**
 * Lower-cased, prefix-free name -> the real file name. The game writes `T_Seedmaker2Icon` while
 * the file is `SeedMaker2Icon.png`, so a plain lookup would miss it. When two files collapse to
 * the same key, the one without a leftover `t_` prefix wins.
 */
function indexOf(availableIcons: ReadonlySet<string>): IconIndex {
  let index = indexCache.get(availableIcons);
  if (!index) {
    const map = new Map<string, string>();
    const names = [...availableIcons].sort(
      (a, b) => Number(/^t_/i.test(a)) - Number(/^t_/i.test(b)) || a.localeCompare(b),
    );
    for (const name of names) {
      const key = stripPrefix(name).toLowerCase();
      if (!map.has(key)) map.set(key, name);
    }
    index = map;
    indexCache.set(availableIcons, index);
  }
  return index;
}

/**
 * `/Game/…/T_AdvancedFuel1Icon.T_AdvancedFuel1Icon` -> the matching pixel-art file name (without
 * extension), ignoring letter case and the `t_` prefix; null when the set has no such file.
 */
export function resolveIcon(assetPath: string, availableIcons: ReadonlySet<string>): string | null {
  const stem = assetStem(assetPath);
  if (stem === null) return null;
  return indexOf(availableIcons).get(stripPrefix(stem).toLowerCase()) ?? null;
}
