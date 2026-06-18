import { describe, expect, it } from "vitest";

import { en } from "./en";
import { es } from "./es";

/**
 * The key test for a bilingual site: the EN and ES dictionaries must share the
 * EXACT same structure (same nested keys, same array-of-object lengths), have no
 * empty values, and only primitive leaves. This catches the most common i18n
 * regression — adding a key to one language and forgetting the other — at CI time
 * instead of at runtime.
 *
 * Note on arrays: a list of strings (e.g. an `accept:` synonym list) is treated as
 * a single LEAF, because its length can legitimately differ across languages.
 * Arrays of OBJECTS (e.g. `screens`, `rounds`) ARE recursed by index, since those
 * are structural and must match across languages.
 */

type Leaf = string | number | boolean | string[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>;

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function flatten(
  value: unknown,
  prefix = "",
  out: Record<string, Leaf> = {},
): Record<string, Leaf> {
  if (Array.isArray(value)) {
    if (value.length === 0 || isStringArray(value)) {
      out[prefix] = value as string[]; // leaf: synonym list (length may vary per language)
    } else {
      value.forEach((item, i) => flatten(item, `${prefix}.${i}`, out));
    }
  } else if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Dict)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out[prefix] = value as Leaf; // string | number | boolean
  }
  return out;
}

const flatEn = flatten(en);
const flatEs = flatten(es);

function isEmptyLeaf(v: Leaf): boolean {
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length > 0 && v.some((s) => s.trim() === "");
  return false;
}

describe("i18n parity", () => {
  it("ES has exactly the same structure/keys as EN (no missing, no extra)", () => {
    const enKeys = new Set(Object.keys(flatEn));
    const esKeys = new Set(Object.keys(flatEs));

    const missingInEs = [...enKeys].filter((k) => !esKeys.has(k));
    const extraInEs = [...esKeys].filter((k) => !enKeys.has(k));

    expect(missingInEs, `Keys in EN but missing in ES:\n${missingInEs.join("\n")}`).toEqual([]);
    expect(extraInEs, `Keys in ES but not in EN:\n${extraInEs.join("\n")}`).toEqual([]);
  });

  it("no value is empty in one language but filled in the other (asymmetric empties)", () => {
    // Some fragments (e.g. `p1End` trailing pieces) are intentionally empty in BOTH
    // languages — that's by design. A real bug is a value empty in ONE language only.
    const asymmetric = Object.keys(flatEn)
      .filter((k) => k in flatEs)
      .filter((k) => isEmptyLeaf(flatEn[k]) !== isEmptyLeaf(flatEs[k]));
    expect(asymmetric, `Values empty in one language only:\n${asymmetric.join("\n")}`).toEqual([]);
  });

  it("every leaf is a primitive (string/number/boolean) or a string[]", () => {
    for (const flat of [flatEn, flatEs]) {
      for (const [k, v] of Object.entries(flat)) {
        const ok =
          typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean" ||
          isStringArray(v);
        expect(ok, `Leaf ${k} is not a primitive/string[]`).toBe(true);
      }
    }
  });

  it("known anchor keys exist in both languages", () => {
    for (const key of ["common.toggleLanguage", "lab.bigram"]) {
      expect(flatEn[key], `EN missing ${key}`).toBeDefined();
      expect(flatEs[key], `ES missing ${key}`).toBeDefined();
    }
  });
});
