// Deterministic, safe math evaluator (no eval). Supports + - * / ^ × ÷, parentheses,
// decimals, percentages (50% = 0.5) and fractions via "/".
export type Num = number;

export function normalizeExpr(s: string): string {
  return s
    .replace(/[×xX✕]/g, "*")
    .replace(/[÷:]/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/,/g, "")
    .replace(/\s+/g, "");
}

export function evaluate(input: string): number | null {
  const s = normalizeExpr(input);
  if (!s || !/^[0-9+\-*/^().%]+$/.test(s)) return null;
  let i = 0;
  const peek = () => s[i];
  function parseExpr(): number {
    let v = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function parseTerm(): number {
    let v = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = s[i++];
      const r = parseFactor();
      if (op === "/" && r === 0) throw new Error("div0");
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function parseFactor(): number {
    const base = parseUnary();
    if (peek() === "^") {
      i++;
      return Math.pow(base, parseFactor());
    }
    return base;
  }
  function parseUnary(): number {
    if (peek() === "-") { i++; return -parseUnary(); }
    if (peek() === "+") { i++; return parseUnary(); }
    return parsePrimary();
  }
  function parsePrimary(): number {
    let v: number;
    if (peek() === "(") {
      i++;
      v = parseExpr();
      if (s[i++] !== ")") throw new Error("paren");
    } else {
      const m = /^\d*\.?\d+/.exec(s.slice(i));
      if (!m) throw new Error("num");
      i += m[0].length;
      v = parseFloat(m[0]);
    }
    if (peek() === "%") { i++; v = v / 100; }
    return v;
  }
  try {
    const v = parseExpr();
    if (i !== s.length || !Number.isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}

/** Parses a student's answer: integers, decimals, fractions (3/4), mixed (1 1/2), percents. */
export function parseAnswer(input: string): number | null {
  const t = input.trim().replace(/,/g, "");
  const mixed = /^(-?\d+)\s+(\d+)\/(\d+)$/.exec(t);
  if (mixed) {
    const w = parseInt(mixed[1]!), n = parseInt(mixed[2]!), d = parseInt(mixed[3]!);
    if (d === 0) return null;
    return w < 0 ? w - n / d : w + n / d;
  }
  return evaluate(t);
}

export function answersMatch(given: string, expected: number | string, tolerance = 1e-6): boolean {
  if (typeof expected === "string" && isNaN(Number(expected)) && !/^[-\d./%\s]+$/.test(expected)) {
    return given.trim().toLowerCase() === expected.trim().toLowerCase();
  }
  const g = parseAnswer(given);
  const e = typeof expected === "number" ? expected : parseAnswer(expected);
  if (g === null || e === null) return false;
  return Math.abs(g - e) <= tolerance * Math.max(1, Math.abs(e));
}

export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 1e6) / 1e6);
}

/** Finds plain arithmetic expressions inside free text, e.g. "what is 12 x 7?" */
export function findArithmetic(text: string): { expr: string; value: number }[] {
  const out: { expr: string; value: number }[] = [];
  const re = /[-(]?\d[\d.,%\s()+\-*/^×÷xX]*\d%?\)?/g;
  for (const m of text.match(re) ?? []) {
    const expr = m.trim();
    if (!/[+\-*/^×÷xX]/.test(expr.replace(/^-/, ""))) continue;
    const value = evaluate(expr);
    if (value !== null) out.push({ expr, value });
  }
  return out;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
