import {random_element} from "@/helpers/helpers";
import ltct_map from "@/assets/ltct_map.json"

export const makeScramble = (zbllKey) => {
  if (!zbllKey) return ""
  const entry = ltct_map[zbllKey]
  const scrambles = entry["scrambles"]

  if (!scrambles || scrambles.length === 0) {
    const algs = entry["algs"]
    if (!algs || algs.length === 0) return ""
    return inverseScramble(algs[0])
  }

  return random_element(scrambles);
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
