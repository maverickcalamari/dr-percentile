import { describe, expect, it } from "vitest";
import { answersMatch, evaluate, findArithmetic, parseAnswer } from "@/lib/math";
import { nextMastery, reviewIntervalDays, earnedBadges } from "@/lib/progress";
import { SKILLS, startUnitFromDiagnostic } from "@/lib/curriculum";

describe("math evaluator", () => {
  it("respects order of operations", () => expect(evaluate("3 + 4 × 2")).toBe(11));
  it("handles division sign and brackets", () => expect(evaluate("(12 + 6) ÷ 3")).toBe(6));
  it("handles percent", () => expect(evaluate("50% * 80")).toBe(40));
  it("rejects code", () => expect(evaluate("alert(1)")).toBeNull());
  it("parses mixed numbers", () => expect(parseAnswer("1 1/2")).toBe(1.5));
  it("accepts equivalent fraction answers", () => expect(answersMatch("4/6", "2/3")).toBe(true));
  it("rejects wrong answers", () => expect(answersMatch("55", 56)).toBe(false));
  it("finds arithmetic in a sentence", () => expect(findArithmetic("what is 12 x 7?")[0]?.value).toBe(84));
});

describe("progress rules", () => {
  it("correct without hint adds 12", () => expect(nextMastery(50, true, false)).toBe(62));
  it("correct with hint adds 6", () => expect(nextMastery(50, true, true)).toBe(56));
  it("wrong subtracts 8, floored at 0", () => expect(nextMastery(5, false, false)).toBe(0));
  it("mastered skills review weekly", () => expect(reviewIntervalDays(85)).toBe(7));
  it("weak skills review tomorrow", () => expect(reviewIntervalDays(20)).toBe(1));
  it("badge for mastering multiplication", () =>
    expect(earnedBadges({ totalAttempts: 3, totalCorrect: 3, masteredSkills: ["mul-facts"], correctWithHint: false })).toContain("times-titan"));
});

describe("curriculum", () => {
  it("every generated question's stated answer verifies against itself", () => {
    for (const s of SKILLS) for (let i = 0; i < 30; i++) {
      const q = s.generate();
      expect(answersMatch(String(q.answer), q.answer)).toBe(true);
    }
  });
  it("arithmetic prompts match the evaluator", () => {
    for (const id of ["mul-facts", "mul-multi", "div-facts", "as-add-regroup", "pre-order-ops"]) {
      const s = SKILLS.find((x) => x.id === id)!;
      for (let i = 0; i < 30; i++) {
        const q = s.generate();
        expect(evaluate(q.prompt.replace("= ?", ""))).toBeCloseTo(Number(q.answer));
      }
    }
  });
  it("diagnostic starts at first missed band", () => expect(startUnitFromDiagnostic([true, true, false])).toBe("mul-div"));
});

it("adjusts the factor range for multiplication and division practice", () => {
  const multiplication = SKILLS.find((skill) => skill.id === "mul-facts")!;
  const division = SKILLS.find((skill) => skill.id === "div-facts")!;
  for (let i = 0; i < 20; i++) {
    expect(Number(multiplication.generate("review").answer)).toBeLessThanOrEqual(49);
    expect(Number(multiplication.generate("challenge").answer)).toBeGreaterThanOrEqual(64);
    expect(Number(division.generate("review").answer)).toBeLessThanOrEqual(7);
    expect(Number(division.generate("challenge").answer)).toBeGreaterThanOrEqual(8);
  }
});
