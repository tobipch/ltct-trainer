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

export const invertMove = (m) => {
  if (!m || m.length === 0) return ""
  if (m[m.length - 1] === '2') return m
  if (m[m.length - 1] === '\'') return m.slice(0, -1)
  return `${m}'`
}

export const inverseScramble = s => {
  return s.split(" ").map(invertMove).reverse().join(" ");
};

export const moveFace = (m) => m[0]

export const moveAmount = (m) => {
  if (m.endsWith("'")) return 3
  if (m.endsWith("2")) return 2
  return 1
}
