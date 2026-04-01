import { Alg } from "cubing/alg";

console.log("Testing experimentalSimplify options\n");

console.log("1. Basic X2' notation (should NOT be simplified)");
const alg1 = new Alg("U2'");
console.log("   Input: U2'");
console.log("   Default toString(): " + alg1.toString());
console.log("   With cancel: true: " + alg1.experimentalSimplify({ cancel: true }).toString());
console.log("   With cancel (same-direction): " + alg1.experimentalSimplify({ cancel: { directional: "same-direction" } }).toString());

console.log("\n2. R R' (should cancel to empty)");
const alg2 = new Alg("R R'");
console.log("   Input: R R'");
console.log("   With cancel: true: '" + alg2.experimentalSimplify({ cancel: true }).toString() + "'");
console.log("   With cancel (same-direction): '" + alg2.experimentalSimplify({ cancel: { directional: "same-direction" } }).toString() + "'");

console.log("\n3. D D' (opposite moves, should cancel to empty)");
const alg3 = new Alg("D D'");
console.log("   Input: D D'");
console.log("   With cancel: true: '" + alg3.experimentalSimplify({ cancel: true }).toString() + "'");

console.log("\n4. R U R' (should NOT change)");
const alg4 = new Alg("R U R'");
console.log("   Input: R U R'");
console.log("   With cancel: true: '" + alg4.experimentalSimplify({ cancel: true }).toString() + "'");

console.log("\n5. R U R' U' D D' L L (complex)");
const alg5 = new Alg("R U R' U' D D' L L");
console.log("   Input: R U R' U' D D' L L");
console.log("   With cancel: true: '" + alg5.experimentalSimplify({ cancel: true }).toString() + "'");

console.log("\n6. U U2 (should simplify to U' or similar)");
const alg6 = new Alg("U U2");
console.log("   Input: U U2");
console.log("   With cancel: true: '" + alg6.experimentalSimplify({ cancel: true }).toString() + "'");

console.log("\n7. Concatenating with concat()");
const part1 = new Alg("R");
const part2 = new Alg("R'");
const combined = part1.concat(part2).experimentalSimplify({ cancel: true });
console.log("   Alg('R').concat(Alg('R\'')).experimentalSimplify({ cancel: true })");
console.log("   Result: '" + combined.toString() + "'");

