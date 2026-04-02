import { puzzles } from "cubing/puzzles";
import { Alg } from "cubing/alg";
import { readFileSync } from "node:fs";

const MAP_PATH = new URL("../src/assets/ltct_map.json", import.meta.url);
const ltctMap = JSON.parse(readFileSync(MAP_PATH, "utf-8"));
const kpuzzle = await puzzles["3x3x3"].kpuzzle();

const EXPECTED_EDGES = [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

let errors = 0;
let checked = 0;

for (const [key, caseData] of Object.entries(ltctMap)) {
  if (!caseData.algs || caseData.algs.length === 0) continue;
  
  const inverseAlg = new Alg(caseData.algs[0]).invert();
  const expectedPattern = kpuzzle.defaultPattern().applyAlg(inverseAlg);
  const expectedCorners = JSON.stringify([...expectedPattern.patternData.CORNERS.pieces]) + "|" + JSON.stringify([...expectedPattern.patternData.CORNERS.orientation]);

  const scrambles = caseData.scrambles;
  for (let i = 0; i < Math.min(3, scrambles.length); i++) {
    const scramble = scrambles[i];
    checked++;

    if (/\w2'/g.test(scramble)) {
      console.log(`NOTATION: ${key} has X2' in scramble: ${scramble.substring(0, 40)}...`);
      errors++;
      continue;
    }

    try {
      const result = kpuzzle.defaultPattern().applyAlg(new Alg(scramble));
      const edges = [...result.patternData.EDGES.pieces];
      const edgeOrient = [...result.patternData.EDGES.orientation];
      const corners = JSON.stringify([...result.patternData.CORNERS.pieces]) + "|" + JSON.stringify([...result.patternData.CORNERS.orientation]);

      const edgesOk = JSON.stringify(edges) === JSON.stringify(EXPECTED_EDGES) && edgeOrient.every(x => x === 0);
      const cornersOk = corners === expectedCorners;

      if (!edgesOk) {
        console.log(`EDGE FAIL: ${key} scramble[${i}]: edges=[${edges}]`);
        errors++;
      }
      if (!cornersOk) {
        console.log(`CORNER FAIL: ${key} scramble[${i}]`);
        errors++;
      }
    } catch(e) {
      console.log(`PARSE ERROR: ${key} scramble[${i}]: ${e.message}`);
      errors++;
    }
  }
  
  if (Object.keys(ltctMap).indexOf(key) > 10 && errors > 5) {
    console.log("... stopping early due to many errors");
    break;
  }
}

console.log(`\nChecked ${checked}, Errors: ${errors}`);
process.exit(0);
