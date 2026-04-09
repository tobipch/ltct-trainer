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

export const amountToMove = (face, amount) => {
  const a = ((amount % 4) + 4) % 4
  if (a === 0) return null
  if (a === 1) return face
  if (a === 2) return face + '2'
  return face + "'"
}

// Move conjugation under cube rotations: R M R⁻¹
// For each rotation, maps face → [targetFace, directionReversed]
// 90° rotations preserve direction; 180° rotations reverse direction for off-axis faces
const ROTATION_CONJUGATION = {
  'x':  { U:['B',false], D:['F',false], F:['U',false], B:['D',false], R:['R',false], L:['L',false] },
  "x'": { U:['F',false], D:['B',false], F:['D',false], B:['U',false], R:['R',false], L:['L',false] },
  'x2': { U:['D',true],  D:['U',true],  F:['B',true],  B:['F',true],  R:['R',false], L:['L',false] },
  'y':  { U:['U',false], D:['D',false], F:['L',false], B:['R',false], R:['F',false], L:['B',false] },
  "y'": { U:['U',false], D:['D',false], F:['R',false], B:['L',false], R:['B',false], L:['F',false] },
  'y2': { U:['U',false], D:['D',false], F:['B',true],  B:['F',true],  R:['L',true],  L:['R',true] },
  'z':  { U:['R',false], D:['L',false], F:['F',false], B:['B',false], R:['D',false], L:['U',false] },
  "z'": { U:['L',false], D:['R',false], F:['F',false], B:['B',false], R:['U',false], L:['D',false] },
  'z2': { U:['D',true],  D:['U',true],  F:['F',false], B:['B',false], R:['L',true],  L:['R',true] },
}

// Build a function that remaps cube-reported moves (standard frame) to user-frame moves
// based on the orientation string (e.g., "z2", "x y").
// Returns null if no orientation is set (identity).
export function buildMoveRemap(orientationString) {
  const rotations = (orientationString || '').trim().split(/\s+/).filter(Boolean)
  if (rotations.length === 0) return null

  const faces = ['U', 'D', 'F', 'B', 'L', 'R']
  let mapping = {}
  for (const f of faces) mapping[f] = [f, false] // [targetFace, reversed]

  // Compose conjugations right-to-left: for "x y", apply y's conjugation first, then x's
  for (let i = rotations.length - 1; i >= 0; i--) {
    const conj = ROTATION_CONJUGATION[rotations[i]]
    if (!conj) continue
    const next = {}
    for (const f of faces) {
      const [curTarget, curRev] = mapping[f]
      const [conjTarget, conjRev] = conj[curTarget]
      next[f] = [conjTarget, curRev !== conjRev]
    }
    mapping = next
  }

  return (move) => {
    const face = moveFace(move)
    const amount = moveAmount(move)
    const [target, reversed] = mapping[face]
    let newAmount = amount
    if (reversed) {
      if (amount === 1) newAmount = 3
      else if (amount === 3) newAmount = 1
    }
    return amountToMove(target, newAmount)
  }
}
