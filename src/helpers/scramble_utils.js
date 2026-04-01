import {random_element} from "@/helpers/helpers";
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
  return random_element(scramblesMap[choosenLength]);
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
