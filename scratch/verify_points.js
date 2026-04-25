
const { calculatePoints } = require('./lib/points');

const testCases = [
    { pos: 1, expected: 100 },
    { pos: 2, expected: 90 },
    { pos: 10, expected: 10 },
    { pos: 11, expected: 9 },
    { pos: 19, expected: 1 },
    { pos: 20, expected: 1 },
    { pos: 50, expected: 1 },
    { pos: 0, expected: 0 },
    { pos: -1, expected: 0 }
];

console.log("--- TESTING POINTS CALCULATION ---");
let allPassed = true;
testCases.forEach(({ pos, expected }) => {
    const result = calculatePoints(pos);
    const passed = result === expected;
    console.log(`Pos: ${pos.toString().padStart(2)} | Expected: ${expected.toString().padStart(3)} | Result: ${result.toString().padStart(3)} | ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (!passed) allPassed = false;
});

if (allPassed) {
    console.log("\n✨ ALL TESTS PASSED! The logic matches the 100 starting points rule.");
} else {
    console.log("\n⚠️ SOME TESTS FAILED.");
    process.exit(1);
}
