/**
 * Generate ambiguous scrambles for all 252 LTCT cases.
 *
 * For each case, creates scrambles by:
 * 1. Taking the inverse of the case algorithm → target corner state
 * 2. Randomizing the edge permutation/orientation (keeping corners fixed)
 * 3. Solving the full cube state with a Kociemba two-phase solver
 * 4. Inverting the solution → scramble that produces the target state
 *
 * Usage: node scripts/generate_scrambles.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { puzzles } from "cubing/puzzles";
import { Alg } from "cubing/alg";
import { KPattern } from "cubing/kpuzzle";
import { experimentalSolve3x3x3IgnoringCenters } from "cubing/search";

const SCRAMBLES_PER_CASE = 25;
const MAP_PATH = new URL("../src/assets/ltct_map.json", import.meta.url);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function permutationParity(perm) {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inversions++;
    }
  }
  return inversions % 2;
}

function randomEdgeState(cornerParity) {
  let edgePerm = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  if (permutationParity(edgePerm) !== cornerParity) {
    [edgePerm[10], edgePerm[11]] = [edgePerm[11], edgePerm[10]];
  }
  const edgeOrient = Array.from({ length: 11 }, () => Math.floor(Math.random() * 2));
  const sum = edgeOrient.reduce((a, b) => a + b, 0);
  edgeOrient.push(sum % 2 === 0 ? 0 : 1);
  return { pieces: edgePerm, orientation: edgeOrient };
}

async function main() {
  const ltctMap = JSON.parse(readFileSync(MAP_PATH, "utf-8"));
  const kpuzzle = await puzzles["3x3x3"].kpuzzle();

  const keys = Object.keys(ltctMap);
  const total = keys.length;
  let done = 0;
  let skipped = 0;

  console.log(`Generating ${SCRAMBLES_PER_CASE} scrambles for ${total} LTCT cases...\n`);

  // Warm up the solver
  const warmupPattern = kpuzzle.defaultPattern().applyAlg(new Alg("R U R'"));
  await experimentalSolve3x3x3IgnoringCenters(warmupPattern);

  const startTime = Date.now();

  for (const key of keys) {
    const caseData = ltctMap[key];

    if (!caseData.algs || caseData.algs.length === 0) {
      skipped++;
      done++;
      console.log(`  [${done}/${total}] ${key} — SKIPPED (no algorithms)`);
      continue;
    }

    const alg = new Alg(caseData.algs[0]);
    const inverseAlg = alg.invert();
    const targetPattern = kpuzzle.defaultPattern().applyAlg(inverseAlg);

    const cornerPieces = [...targetPattern.patternData.CORNERS.pieces];
    const cornerOrient = [...targetPattern.patternData.CORNERS.orientation];
    const cornerParity = permutationParity(cornerPieces);

    const scramblesByLength = {};

    for (let i = 0; i < SCRAMBLES_PER_CASE; i++) {
      const edgeState = randomEdgeState(cornerParity);
      const patternData = {
        EDGES: { pieces: edgeState.pieces, orientation: edgeState.orientation },
        CORNERS: { pieces: [...cornerPieces], orientation: [...cornerOrient] },
        CENTERS: { pieces: [0, 1, 2, 3, 4, 5], orientation: [0, 0, 0, 0, 0, 0] },
      };
      const randomPattern = new KPattern(kpuzzle, patternData);
      const solution = await experimentalSolve3x3x3IgnoringCenters(randomPattern);
      const scramble = solution.invert().toString();
      const moveCount = scramble.split(" ").length;

      const bucket = `${moveCount}`;
      if (!scramblesByLength[bucket]) {
        scramblesByLength[bucket] = [];
      }
      scramblesByLength[bucket].push(scramble);
    }

    caseData.scrambles = scramblesByLength;
    done++;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (done / (Date.now() - startTime)) * 1000;
    const eta = ((total - done) / rate).toFixed(0);
    console.log(
      `  [${done}/${total}] ${key} — ${SCRAMBLES_PER_CASE} scrambles (${elapsed}s elapsed, ~${eta}s remaining)`,
    );
  }

  // Sort scramble keys numerically for each case
  for (const caseData of Object.values(ltctMap)) {
    if (Object.keys(caseData.scrambles).length > 0) {
      const sorted = {};
      for (const len of Object.keys(caseData.scrambles).sort((a, b) => +a - +b)) {
        sorted[len] = caseData.scrambles[len];
      }
      caseData.scrambles = sorted;
    }
  }

  writeFileSync(MAP_PATH, JSON.stringify(ltctMap, null, 2) + "\n");

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${total - skipped} cases processed, ${skipped} skipped, in ${totalTime}s`);
  console.log(`Written to ${MAP_PATH}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
