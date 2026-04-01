import { Alg } from "cubing/alg";

console.log("Test 1: U2' notation");
const alg1 = new Alg("U2'");
console.log("Input: U2'");
console.log("Output: " + alg1.toString());

console.log("\nTest 2: R R'");
const alg2 = new Alg("R R'");
console.log("Input: R R'");
console.log("Output: " + alg2.toString());

console.log("\nTest 3: D D' (opposite moves)");
const alg3 = new Alg("D D'");
console.log("Input: D D'");
console.log("Output: " + alg3.toString());

console.log("\nTest 4: With experimentalSimplify");
const alg4 = new Alg("R R'").experimentalSimplify({ cancel: true });
console.log("Input: R R'");
console.log("Output with cancel: " + alg4.toString());

console.log("\nTest 5: D D' with simplify");
const alg5 = new Alg("D D'").experimentalSimplify({ cancel: true });
console.log("Input: D D'");
console.log("Output with cancel: " + alg5.toString());

console.log("\nTest 6: U2' with simplify");
const alg6 = new Alg("U2'").experimentalSimplify({ cancel: true });
console.log("Input: U2'");
console.log("Output with cancel: " + alg6.toString());

console.log("\nTest 7: Complex sequence");
const alg7 = new Alg("R U R' U' D D' L L").experimentalSimplify({ cancel: true });
console.log("Input: R U R' U' D D' L L");
console.log("Output with cancel: " + alg7.toString());

