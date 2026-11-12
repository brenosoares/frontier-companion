// @vitest-environment node
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyItemIcons, listIconNames } from "./icons";

let root: string;
let source: string;
let dest: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "fc-icons-"));
  source = path.join(root, "source");
  dest = path.join(root, "dest");
  await mkdir(source, { recursive: true });
  await Promise.all(
    ["WheatIcon.png", "OreIcon.png", "Unused.png", "notes.txt"].map((file) =>
      writeFile(path.join(source, file), "x"),
    ),
  );
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("listIconNames", () => {
  it("returns PNG names without extension and ignores other files", async () => {
    expect(await listIconNames(source)).toEqual(new Set(["WheatIcon", "OreIcon", "Unused"]));
  });
});

describe("copyItemIcons", () => {
  it("copies only the icons used by items, once each", async () => {
    const count = await copyItemIcons(
      [{ icon: "WheatIcon" }, { icon: "WheatIcon" }, { icon: null }, { icon: "OreIcon" }],
      source,
      dest,
    );

    expect(count).toBe(2);
    expect((await readdir(dest)).sort()).toEqual(["OreIcon.png", "WheatIcon.png"]);
  });

  it("rebuilds the destination so stale icons are removed", async () => {
    await copyItemIcons([{ icon: "WheatIcon" }], source, dest);
    await copyItemIcons([{ icon: "OreIcon" }], source, dest);

    expect(await readdir(dest)).toEqual(["OreIcon.png"]);
  });
});
