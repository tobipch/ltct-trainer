/**
 * Fetch latest LTCT algorithms from blddb and update ltct_map.json.
 *
 * Matching strategy: convert blddb Chichu-scheme keys to position notation,
 * then match against existing ltct_map keys. Only the `algs` arrays are
 * updated; scrambles are left untouched since they depend on the case
 * geometry, not the specific algorithm text.
 *
 * Usage: node scripts/fetch_blddb_algs.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";

const BLDDB_URL =
  "https://raw.githubusercontent.com/nbwzx/blddb/v2/public/data/ltctManmade.json";
const MAP_PATH = new URL("../src/assets/ltct_map.json", import.meta.url);

// ── Chichu letter scheme ───────────────────────────��────────────────────
// Each character maps to the corresponding position in positionArray.
// Spaces represent face centers (not used for corners).
const CHICHU =
  "DEGC GAAJEDCX TQLMBBLS QNJYKHIR ZZPSHFFY WTNPWIXK OOMR";

const POSITION_ARRAY = [
  "UBL", "UB", "UBR", "UL", "U", "UR", "UFL", "UF", "UFR",
  "LUB", "LU", "LUF", "LB", "L", "LF", "LDB", "LD", "LDF",
  "FUL", "FU", "FUR", "FL", "F", "FR", "FDL", "FD", "FDR",
  "RUF", "RU", "RUB", "RF", "R", "RB", "RDF", "RD", "RDB",
  "BUR", "BU", "BUL", "BR", "B", "BL", "BDR", "BD", "BDL",
  "DFL", "DF", "DFR", "DL", "D", "DR", "DBL", "DB", "DBR",
];

// Build letter → position lookup (corner stickers only = 3-char positions)
const letterToPos = {};
for (let i = 0; i < POSITION_ARRAY.length; i++) {
  const ch = CHICHU[i];
  if (ch !== " " && POSITION_ARRAY[i].length === 3) {
    letterToPos[ch] = POSITION_ARRAY[i];
  }
}

/**
 * Convert a Chichu 3-letter key like "JAE" to position notation like
 * "UFL LUB" (dropping the first letter which is the buffer for J-series,
 * or extracting targets + twist for A/D/G-series).
 */
function chichuKeyToPositions(key) {
  return key.split("").map((ch) => letterToPos[ch] || ch);
}

// ── Main ──────────────────��─────────────────────────────────���───────────

async function main() {
  // 1. Fetch blddb data
  console.log("Fetching algorithms from blddb...");
  const res = await fetch(BLDDB_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const blddbData = await res.json();
  console.log(`  Got ${Object.keys(blddbData).length} blddb entries.\n`);

  // 2. Load our map
  const ltctMap = JSON.parse(readFileSync(MAP_PATH, "utf-8"));
  const ourKeys = Object.keys(ltctMap);
  console.log(`  Local ltct_map has ${ourKeys.length} cases.\n`);

  // 3. Build index: first-alg → our-key (for fallback matching)
  const algToOurKey = {};
  for (const [key, val] of Object.entries(ltctMap)) {
    for (const alg of val.algs) {
      algToOurKey[alg.trim()] = key;
    }
  }

  // 4. Build index: position-pair → our-key
  //    Our keys look like "UU UFL LUB". The last two words are the sticker
  //    positions. Build a lookup by sorted sticker pair.
  const positionPairToKeys = {};
  for (const key of ourKeys) {
    const parts = key.split(" ");
    const pair = [parts[1], parts[2]].sort().join("+");
    if (!positionPairToKeys[pair]) positionPairToKeys[pair] = [];
    positionPairToKeys[pair].push(key);
  }

  // 5. Match blddb entries to our cases and collect updated algorithms
  //    Only process J-prefix keys (UFR buffer), which is what this trainer uses.
  let matched = 0;
  let updated = 0;
  let unmatched = 0;
  let skipped = 0;

  for (const [blddbKey, entries] of Object.entries(blddbData)) {
    if (!blddbKey.startsWith("J")) {
      skipped++;
      continue;
    }

    // Collect all algorithms for this blddb case
    const allAlgs = [];
    for (const entry of entries) {
      for (const alg of entry[0]) {
        allAlgs.push(alg.trim());
      }
    }

    if (allAlgs.length === 0) continue;

    // Strategy 1: match by first algorithm text
    let ourKey = algToOurKey[allAlgs[0]];

    // Strategy 2: match by position pair from Chichu key
    if (!ourKey) {
      const positions = chichuKeyToPositions(blddbKey);
      // For J-series (JAE): positions[0]=UFR (buffer), targets are [1] and [2]
      // For A/D/G-series with K/L suffix: targets are [0] and [1], [2] is twist indicator
      let targetPositions;
      if (blddbKey.startsWith("J")) {
        targetPositions = [positions[1], positions[2]];
      } else if (blddbKey.length === 3) {
        targetPositions = [positions[0], positions[1]];
      } else {
        continue; // unexpected format
      }

      const pair = targetPositions.sort().join("+");
      const candidates = positionPairToKeys[pair] || [];

      // If there's exactly one candidate, use it. Otherwise try alg matching.
      if (candidates.length === 1) {
        ourKey = candidates[0];
      } else if (candidates.length > 1) {
        // Multiple candidates (different twist types) — try alg matching
        for (const alg of allAlgs) {
          for (const candidate of candidates) {
            if (ltctMap[candidate].algs.includes(alg)) {
              ourKey = candidate;
              break;
            }
          }
          if (ourKey) break;
        }
      }
    }

    if (!ourKey) {
      unmatched++;
      console.log(`  ✗ No match for blddb key "${blddbKey}"`);
      continue;
    }

    matched++;

    // Check if algorithms changed
    const oldAlgs = ltctMap[ourKey].algs;
    if (JSON.stringify(oldAlgs) !== JSON.stringify(allAlgs)) {
      ltctMap[ourKey].algs = allAlgs;
      updated++;
      console.log(
        `  ✓ Updated "${ourKey}" (${oldAlgs.length} → ${allAlgs.length} algs)`
      );
    }
  }

  const jCount = Object.keys(blddbData).filter((k) => k.startsWith("J")).length;
  console.log(
    `\nSummary: ${matched} matched, ${updated} updated, ${unmatched} unmatched out of ${jCount} UFR-buffer entries (${skipped} non-UFR skipped).`
  );

  // 6. Write back
  if (updated > 0) {
    writeFileSync(MAP_PATH, JSON.stringify(ltctMap, null, 2) + "\n");
    console.log(`\nWritten updated ltct_map.json.`);
  } else {
    console.log(`\nNo changes — ltct_map.json is up to date.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
