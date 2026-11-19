export type Fraction = { numerator: number; denominator: number };

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

function reduce(numerator: number, denominator: number): Fraction {
  const factor = gcd(numerator, denominator);
  return { numerator: numerator / factor, denominator: denominator / factor };
}

function parseQuantity(input: string): Fraction | null {
  const quantity = input.trim().replace(/[⁄∕]/g, "/");
  if (/^\d{1,4}$/.test(quantity)) return { numerator: Number(quantity), denominator: 1 };
  const match = /^(?:(\d{1,4})\s+)?(\d{1,4})\s*\/\s*(\d{1,4})$/.exec(quantity);
  if (!match) return null;
  const whole = Number(match[1] ?? 0);
  const numerator = Number(match[2]);
  const denominator = Number(match[3]);
  return denominator ? reduce(whole * denominator + numerator, denominator) : null;
}

export function fractionText({ numerator, denominator }: Fraction): string {
  return denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;
}

export function solveFractionDivision(totalText: string, divisorText: string) {
  const total = parseQuantity(totalText);
  const divisor = parseQuantity(divisorText);
  if (!total || !divisor || divisor.numerator === 0) return null;

  const reciprocal = { numerator: divisor.denominator, denominator: divisor.numerator };
  const numerator = total.numerator * reciprocal.numerator;
  const denominator = total.denominator * reciprocal.denominator;
  const exact = reduce(numerator, denominator);
  const wholeGroups = Math.floor(exact.numerator / exact.denominator);
  return {
    exact,
    wholeGroups,
    steps: [
      `Write the quantities as fractions: ${fractionText(total)} ÷ ${fractionText(divisor)}.`,
      `Multiply by the reciprocal of the divisor: ${fractionText(total)} × ${fractionText(reciprocal)}.`,
      `Multiply the numerators and the denominators: ${numerator}/${denominator}.`,
      `Simplify: ${fractionText(exact)}.`,
    ],
  };
}
