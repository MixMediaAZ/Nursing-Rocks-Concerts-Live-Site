/**
 * Move "(1)", "(2)", "(3)" duplicate variants out of the Phoenix photos
 * parent folder into a sibling _duplicates folder. Never deletes.
 *
 * The kept file is the one without a "(N)" suffix when present; if only
 * variants exist, keeps the largest one and moves the rest.
 *
 * Usage:
 *   node scripts/dedupe-phoenix-folder.mjs            # dry-run by default
 *   node scripts/dedupe-phoenix-folder.mjs --apply    # actually move files
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const SRC_DIR =
  "C:/Users/Dave/Downloads/Nursing Rocks! Phoenix Photos - Sizzle Reel & Website";
const DEST_DIR = path.join(SRC_DIR, "_duplicates");
const APPLY = process.argv.includes("--apply");

const VARIANT_RE = /^(.*?)(?:\s*\((\d+)\))?(\.[^.]+)$/;

async function main() {
  const entries = await fs.readdir(SRC_DIR, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);

  // Group by (basename, extension) ignoring " (N)" suffix.
  const groups = new Map();
  for (const name of files) {
    const m = name.match(VARIANT_RE);
    if (!m) continue;
    const [, base, , ext] = m;
    const key = `${base.trim()}${ext.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(name);
  }

  const toMove = [];

  for (const [key, names] of groups) {
    if (names.length <= 1) continue;

    // Prefer the name without "(N)" as the "keeper"; tiebreak by largest file size.
    const withStat = await Promise.all(
      names.map(async (n) => ({
        name: n,
        hasSuffix: / \(\d+\)\.[^.]+$/.test(n),
        size: (await fs.stat(path.join(SRC_DIR, n))).size,
      }))
    );

    withStat.sort((a, b) => {
      if (a.hasSuffix !== b.hasSuffix) return a.hasSuffix ? 1 : -1;
      return b.size - a.size;
    });

    const [keeper, ...dupes] = withStat;
    console.log(`KEEP  ${keeper.name}  (${(keeper.size / 1024 / 1024).toFixed(2)} MB)`);
    for (const d of dupes) {
      console.log(`  MOVE ${d.name}  (${(d.size / 1024 / 1024).toFixed(2)} MB)`);
      toMove.push(d.name);
    }
  }

  console.log(`\n${toMove.length} files to move.${APPLY ? "" : " (dry-run; pass --apply to execute)"}`);

  if (!APPLY || toMove.length === 0) return;

  await fs.mkdir(DEST_DIR, { recursive: true });
  for (const name of toMove) {
    const src = path.join(SRC_DIR, name);
    const dst = path.join(DEST_DIR, name);
    await fs.rename(src, dst);
  }
  console.log(`✅ Moved ${toMove.length} files to ${DEST_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
