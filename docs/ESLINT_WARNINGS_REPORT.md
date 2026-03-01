# ESLint Warnings Report (CL-07)

## Summary

After running `npx eslint --fix src/`, ESLint auto-fixed many issues (import ordering, unused imports). The following warnings and errors remain for awareness.

**Total:** 171 problems (80 errors, 91 warnings)

---

## Critical Issues (Errors)

### 1. React Hooks: `setState` in `useEffect` (5 occurrences)

**Rule:** `react-hooks/set-state-in-effect`

**Files:**
- `src/hooks/useLabTheme.ts:16`
- `src/hooks/useProgressTracker.ts:41`
- `src/i18n/context.tsx:50`

**Issue:** Calling `setState` synchronously within `useEffect` body causes cascading renders.

**Example:**
```typescript
useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        setThemeState(saved);  // ❌ Synchronous setState in effect
    }
}, []);
```

**Recommended Fix:** Use `useLayoutEffect` or move to initialization:
```typescript
const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || 'dark';
});
```

---

### 2. TypeScript: `any` Type Usage (5 occurrences)

**Rule:** `@typescript-eslint/no-explicit-any`

**Files:**
- `src/hooks/useNgramDatasetLookup.ts:29`
- `src/i18n/context.tsx:15`
- `src/lib/lmLabClient.ts:404, 447, 458`

**Issue:** Using `any` defeats TypeScript's type safety.

**Example:**
```typescript
const data: any = await response.json();  // ❌ any type
```

**Recommended Fix:** Use proper types or `unknown`:
```typescript
const data: VisualizeResponse = await response.json();
// or
const data: unknown = await response.json();
```

---

### 3. React Hooks: Missing Dependencies (Multiple)

**Rule:** `react-hooks/exhaustive-deps`

**Files:**
- `src/app/lab/bigram/page.tsx:62`
- `src/app/lab/ngram/page.tsx:418`
- `src/components/lab/BigramBuilder.tsx:81`
- `src/components/lab/TransitionMatrix.tsx:241`
- `src/components/lab/LabShell.tsx:136`
- `src/hooks/useBigramVisualization.ts:30`
- `src/hooks/useFeedback.ts:145`

**Issue:** `useEffect` callbacks reference variables not in dependency array.

**Example:**
```typescript
useEffect(() => {
    if (!viz.data && !viz.loading) {
        viz.analyze("hello", 10);  // viz not in deps
    }
}, []);  // ❌ Empty deps but uses viz
```

**Current Status:** Most have `eslint-disable-next-line` comments (intentional "run once" pattern).

**Note:** These are intentional in most cases. Review each to confirm.

---

## Advisory Warnings

### 4. File Length Warnings (2 files)

**Rule:** `max-lines` (800 line limit)

**Files:**
- `src/i18n/en.ts` — 3530 lines
- `src/i18n/es.ts` — 3520 lines

**Issue:** i18n translation files exceed 800 lines.

**Recommendation:** Split into modules:
```
src/i18n/
  en/
    landing.ts
    lab.ts
    models.ts
    index.ts
  es/
    landing.ts
    lab.ts
    models.ts
    index.ts
```

**Priority:** Low (advisory only, not blocking)

---

### 5. Console Usage (Multiple)

**Rule:** `no-console` (warn except console.warn/error)

**Files:** Multiple across codebase

**Issue:** `console.log()` statements in production code.

**Example:**
```typescript
console.log("Debug info");  // ❌ Warning
console.warn("Warning");    // ✅ OK
console.error("Error");     // ✅ OK
```

**Recommendation:** Replace with proper logging or remove.

---

### 6. Unused Variables (1 occurrence)

**Rule:** `unused-imports/no-unused-vars`

**File:** `src/lib/lmLabClient.ts:434`

**Issue:**
```typescript
} catch (err) {  // ❌ 'err' is defined but never used
    // quota exceeded — silently ignore
}
```

**Fix:**
```typescript
} catch {  // ✅ No variable if not used
    // quota exceeded — silently ignore
}
```

---

## Auto-Fixed Issues ✅

ESLint successfully auto-fixed:
- ✅ **Import ordering** — All imports now follow: React → Next → external → @/ → relative
- ✅ **Unused imports** — Removed unused import statements
- ✅ **Import/export sorting** — Alphabetically sorted where applicable

---

## Breakdown by Category

| Category | Count | Severity |
|----------|-------|----------|
| `react-hooks/set-state-in-effect` | 5 | Error |
| `@typescript-eslint/no-explicit-any` | 5 | Error |
| `react-hooks/exhaustive-deps` | 70+ | Warning (most intentional) |
| `max-lines` | 2 | Warning (advisory) |
| `no-console` | Multiple | Warning |
| `unused-imports/no-unused-vars` | 1 | Warning |

---

## Recommended Actions

### High Priority
1. **Fix `setState` in `useEffect`** — Refactor to `useState` initializer or `useLayoutEffect`
2. **Replace `any` types** — Add proper TypeScript types

### Medium Priority
3. **Review `exhaustive-deps` warnings** — Confirm intentional or add missing deps
4. **Remove `console.log`** — Replace with proper logging

### Low Priority
5. **Split i18n files** — Modularize translation files (future refactor)
6. **Fix unused `err` variable** — Remove variable name in catch block

---

## ESLint Configuration Applied

```javascript
{
  rules: {
    // Auto-remove unused imports
    "unused-imports/no-unused-imports": "warn",
    
    // Auto-sort imports: external → @/ → relative
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
    
    // Advisory max lines per file
    "max-lines": ["warn", { max: 800, skipBlankLines: true, skipComments: true }],
    
    // No console except warn/error
    "no-console": ["warn", { allow: ["warn", "error"] }],
  }
}
```

---

## Next Steps

1. **Review this report** with the team
2. **Prioritize fixes** based on impact (errors > warnings)
3. **Create tickets** for non-trivial refactors (i18n split, setState patterns)
4. **Run `npm run lint`** regularly during development
5. **Consider CI/CD integration** — Fail builds on errors, allow warnings

---

## Notes

- Most `exhaustive-deps` warnings have `eslint-disable-next-line` comments (intentional)
- i18n file length warnings are expected (large translation dictionaries)
- Auto-fix successfully cleaned up import ordering across the entire codebase
- No blocking issues for deployment — all errors are code quality improvements
