/**
 * Verify that generated scrambles produce correct LTCT states.
 * Checks: edges = [1,0,2,3,...,11] with all-zero orientation.
 * Corners match the expected state from inverse(algorithm).
 */

import { readFileSync } from "node:fs";
import { puzzles } from "cubing/puzzles";
import { Alg } from "cubing/alg";

const MAP_PATH = new URL("../src/assets/ltct_map.json", import.meta.url);
const EXPECTED_EDGES = [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const EXPECTED_EDGE_ORIENT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const ltctMap = JSON.parse(readFileSync(MAP_PATH, "utf-8"));
const kpuzzle = await puzzles["3x3x3"].kpuzzle();

let checked = 0;
let errors = 0;
const SAMPLE_SIZE = 3; // check first N scrambles per case

for (const [key, caseData] of Object.entries(ltctMap)) {
  if (!caseData.algs || caseData.algs.length === 0) continue;

  // Expected corner state
  const inverseAlg = new Alg(caseData.algs[0]).invert();
  const expectedPattern = kpuzzle.defaultPattern().applyAlg(inverseAlg);
  const expectedCornerPieces = [...expectedPattern.patternData.CORNERS.pieces];
  const expectedCornerOrient = [...expectedPattern.patternData.CORNERS.orientation];

  for (const [len, scrambles] of Object.entries(caseData.scrambles)) {
    for (let i = 0; i < Math.min(SAMPLE_SIZE, scrambles.length); i++) {
      const scramble = scrambles[i];
      const result = kpuzzle.defaultPattern().applyAlg(new Alg(scramble));

      const edgePieces = [...result.patternData.EDGES.pieces];
      const edgeOrient = [...result.patternData.EDGES.orientation];
      const cornerPieces = [...result.patternData.CORNERS.pieces];
      const cornerOrient = [...result.patternData.CORNERS.orientation];

      // Check edges
      const edgesOk =
        JSON.stringify(edgePieces) === JSON.stringify(EXPECTED_EDGES) &&
        JSON.stringify(edgeOrient) === JSON.stringify(EXPECTED_EDGE_ORIENT);

      // Check corners
      const cornersOk =
        JSON.stringify(cornerPieces) === JSON.stringify(expectedCornerPieces) &&
        JSON.stringify(cornerOrient) === JSON.stringify(expectedCornerOrient);

      if (!edgesOk || !cornersOk) {
        errors++;
        console.error(`FAIL: ${key} scramble[${len}][${i}]: ${scramble}`);
        if (!edgesOk) {
          console.error(`  Edges: got [${edgePieces}] orient [${edgeOrient}]`);
          console.error(`  Expected: [${EXPECTED_EDGES}] orient [${EXPECTED_EDGE_ORIENT}]`);
        }
        if (!cornersOk) {
          console.error(`  Corners: got [${cornerPieces}] orient [${cornerOrient}]`);
          console.error(`  Expected: [${expectedCornerPieces}] orient [${expectedCornerOrient}]`);
        }
      }
      checked++;
    }
  }
}

console.log(`\nVerified ${checked} scrambles across ${Object.keys(ltctMap).length} cases.`);
if (errors === 0) {
  console.log("ALL PASSED — every scramble produces the correct LTCT state.");
} else {
  console.error(`${errors} FAILURES found.`);
}
process.exit(errors > 0 ? 1 : 0);
