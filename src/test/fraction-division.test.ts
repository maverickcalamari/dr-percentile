import { expect, it } from "vitest";
import { fractionText, solveFractionDivision } from "@/lib/fraction-division";

it.each([
  ["1", "2/3", "3/2"],
  ["1/2", "3/10", "5/3"],
  ["3", "9 2/3", "9/29"],
  ["9 2/3", "3", "29/9"],
  ["10", "1 1/2", "20/3"],
  ["5", "2/3", "15/2"],
  ["3/5", "7", "3/35"],
  ["1/3", "5/6", "2/5"],
])("solves %s divided by %s exactly", (total, divisor, expected) => {
  const answer = solveFractionDivision(total, divisor)!;
  expect(fractionText(answer.exact)).toBe(expected);
});

it("counts complete groups and rejects invalid divisors", () => {
  expect(solveFractionDivision("10", "1 1/2")?.wholeGroups).toBe(6);
  expect(solveFractionDivision("10", "0")).toBeNull();
  expect(solveFractionDivision("10", "1/0")).toBeNull();
});
