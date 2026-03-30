import {random_element, shuffle} from "@/helpers/helpers";
import ltct_map from "@/assets/ltct_map.json"

export const makeScramble = (zbllKey, preferredLength) => {
  if (!zbllKey) return ""
  const entry = ltct_map[zbllKey]
  const scramblesMap = entry["scrambles"] // {"13": [scrambles], "14": [scrambles], …}
  const lengthVariations = Object.keys(scramblesMap)

  // If no pre-generated scrambles, fall back to inverse of first algorithm
  if (lengthVariations.length === 0) {
    const algs = entry["algs"]
    if (!algs || algs.length === 0) return ""
    return inverseScramble(algs[0])
  }

  preferredLength = `${preferredLength}` // to string
  const choosenLength = lengthVariations.includes(preferredLength) ? preferredLength : lengthVariations[0]
  return applyRotationButLessB(random_element(scramblesMap[choosenLength]));
}

export const inverseScramble = s => {
  const arr = s.split(" ");

  return arr.map((it) => {
    if (it.length === 0) {
      return "";
    }

    if (it[it.length - 1] === '2') {
      return it;
    } else if (it[it.length - 1] === '\'') {
      return it.slice(0, -1);
    } else {
      return `${it}'`;
    }
  }).reverse().join(" ");
};


// applies 2 random y-rotations to the given alg and returns the one with less B moves in it
const applyRotationButLessB = alg => {
  const yArr = shuffle(["", "y", "y2", "y'"]);
  const a1 = applyRotation(alg, yArr[0]);
  const a2 = applyRotation(alg, yArr[2]);

  const numB1 = (a1.match(/B/g) || []).length;
  const numB2 = (a2.match(/B/g) || []).length;

  return numB1 < numB2 ? a1 : a2;
}

// Returns sequence of moves that get the cube to the same position as (alg + rot) does, but without cube rotations.
// Example: applyRotationForAlgorithm("R U R'", "y") = "F U F'"
const applyRotation = (alg, yRotation) => {
  const rotations = {
    "y": {R: "F", F: "L", L: "B", B: "R"},
    "y'": {R: "B", B: "L", L: "F", F: "R"},
    "y2": {R: "L", L: "R", B: "F", F: "B"},
  };

  const mapObj = rotations[yRotation];
  if (!mapObj) {
    return alg;
  }

  const searchStr = Object.keys(mapObj).join("|");
  const re = new RegExp(searchStr, "gi");

  return alg.replace(re, (matched) => mapObj[matched]);
};
