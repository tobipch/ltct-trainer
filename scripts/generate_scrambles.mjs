/**
 * Generate ambiguous scrambles for all 252 LTCT cases.
 *
 * LTCT cube state: all edges solved except UF↔UR swap, plus specific corner
 * permutation/orientation per case. Scrambles must produce exactly this state.
 *
 * Approach (adapted from Alg-Trainer's obfusticate method):
 * 1. Apply inverse(premoves) + inverse(algorithm) to solved cube → state S
 * 2. Solve S with Kociemba → solution
 * 3. Scramble = premoves + inverse(solution)
 *    This always produces the exact LTCT state (P · P⁻¹ · A = A),
 *    but expressed as different moves each time.
 * 4. If scramble < MIN_LENGTH moves, retry with more premoves.
 *
 * Usage: node scripts/generate_scrambles.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { puzzles } from "cubing/puzzles";
import { Alg } from "cubing/alg";
import { experimentalSolve3x3x3IgnoringCenters } from "cubing/search";

const SCRAMBLES_PER_CASE = 25;
const MIN_LENGTH = 16;
const MAX_PREMOVES = 10;
const INITIAL_PREMOVES = 3;
const MAP_PATH = new URL("../src/assets/ltct_map.json", import.meta.url);

const MOVES = ["U", "R", "F", "D", "L", "B"];
const SUFFIXES = ["", "'", "2"];
// Opposite faces (index pairs that shouldn't follow each other)
const OPPOSITE = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };

function generatePremoves(n) {
  let previous = "";
  let result = [];
  for (let i = 0; i < n; i++) {
    let move;
    do {
      move = MOVES[Math.floor(Math.random() * MOVES.length)];
    } while (move === previous || move === OPPOSITE[previous]);
    previous = move;
    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    result.push(move + suffix);
  }
  return result.join(" ");
}

function invertMoves(movesStr) {
  return new Alg(movesStr).invert().toString();
}

function moveCount(scrambleStr) {
  return scrambleStr.trim().split(/\s+/).length;
}

async function generateOneScramble(kpuzzle, inverseAlgStr, solve) {
  for (let numPremoves = INITIAL_PREMOVES; numPremoves <= MAX_PREMOVES; numPremoves++) {
    const premoves = generatePremoves(numPremoves);
    const inversePremoves = invertMoves(premoves);

    // Apply inverse(premoves) + inverse(algorithm) to solved cube
    const combined = inversePremoves + " " + inverseAlgStr;
    const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(combined));

    // Solve the state
    const solution = await solve(pattern);
    const inverseSolution = solution.invert().toString();

    // Scramble = premoves + inverse(solution)
    // Simplify by parsing through Alg to cancel redundant moves
    const scramble = new Alg(premoves + " " + inverseSolution).toString();

    if (moveCount(scramble) >= MIN_LENGTH) {
      return scramble;
    }
    // Too short — retry with more premoves
  }
  // Fallback: return whatever we get with MAX_PREMOVES
  const premoves = generatePremoves(MAX_PREMOVES);
  const inversePremoves = invertMoves(premoves);
  const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(inversePremoves + " " + inverseAlgStr));
  const solution = await solve(pattern);
  return new Alg(premoves + " " + solution.invert().toString()).toString();
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

    const algStr = caseData.algs[0];
    const inverseAlgStr = new Alg(algStr).invert().toString();

    const scramblesByLength = {};

    for (let i = 0; i < SCRAMBLES_PER_CASE; i++) {
      const scramble = await generateOneScramble(
        kpuzzle,
        inverseAlgStr,
        experimentalSolve3x3x3IgnoringCenters,
      );
      const count = moveCount(scramble);
      const bucket = `${count}`;
      if (!scramblesByLength[bucket]) {
        scramblesByLength[bucket] = [];
      }
      scramblesByLength[bucket].push(scramble);
    }

    // Sort scramble keys numerically
    const sorted = {};
    for (const len of Object.keys(scramblesByLength).sort((a, b) => +a - +b)) {
      sorted[len] = scramblesByLength[len];
    }
    caseData.scrambles = sorted;
    done++;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (done / (Date.now() - startTime)) * 1000;
    const eta = ((total - done) / rate).toFixed(0);
    console.log(
      `  [${done}/${total}] ${key} — ${SCRAMBLES_PER_CASE} scrambles (${elapsed}s elapsed, ~${eta}s remaining)`,
    );
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
