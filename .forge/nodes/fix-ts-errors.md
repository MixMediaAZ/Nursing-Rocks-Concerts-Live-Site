# NODE: fix-ts-errors
## Generic TypeScript compilation error resolution

---

## SOLUTION
Fix TypeScript errors in-place. Do not refactor. Do not change architecture. Fix types only.

## STACK VARIANT
Any TypeScript project

## DEPENDENCIES
None — always node 1 if TypeScript errors exist

## INPUTS REQUIRED
Output of: `npx tsc --noEmit 2>&1`

## INSTRUCTIONS

### Step 1 — Baseline
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```
Log error count in PROJECT_STATE.md.

### Step 2 — Classify errors by type
```bash
npx tsc --noEmit 2>&1 > ts-errors.txt
cat ts-errors.txt
```
Group into:
- API response typing errors → apply fix-ts-api-types.md pattern
- Fetch call signature errors → apply fix-ts-fetch.md pattern
- ORM query type errors → apply fix-ts-orm.md pattern
- Component prop errors → apply fix-ts-props.md pattern

### Step 3 — Fix order: foundational types first
Fix shared types and interfaces before fixing files that use them.
Fix server-side types before client-side types.
Fix one file group at a time. Validate count decreases after each group.

### Step 4 — Common fixes

**Fetch signature errors:**
```typescript
// Wrong:
fetch(url, { method: 'POST', body: data })
// Correct:
fetch(url, { method: 'POST', body: JSON.stringify(data) } as RequestInit)
```

**Unknown error object:**
```typescript
// Wrong:
catch(err) { console.log(err.message) }
// Correct:
catch(err) { console.log((err as Error).message) }
```

**Implicit any in map:**
```typescript
// Wrong:
items.map(item => item.id)
// Correct:
items.map((item: ItemType) => item.id)
```

**ORM inference (Drizzle):**
```typescript
type TableRow = typeof myTable.$inferSelect
```

**ORM inference (Prisma):**
```typescript
import type { ModelName } from '@prisma/client'
```

### Step 5 — Final check
```bash
npx tsc --noEmit
npm run build
```

## VALIDATION
```bash
npx tsc --noEmit    # must exit 0, no output
npm run build       # must complete successfully
npm run dev         # must start without errors
```

## LOCKED_BY
Every other node. Nothing deploys until this passes.

## OUTPUT
Zero TypeScript errors. Successful production build.

## FAILURE MODES

**Failure Mode 1: Fixing one file breaks another**
Fix the source type definition first, then cascade fixes follow.

**Failure Mode 2: Error count not decreasing**
Stop fixing individual errors. Find the shared type/interface that
multiple files depend on and fix that first.

**Failure Mode 3: Build fails after tsc passes**
Vite/webpack may have additional checks. Run build output separately.
`npm run build 2>&1 | head -50`
