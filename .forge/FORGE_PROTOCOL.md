# FORGE PROTOCOL
## Command Reference — Every Session

---

## /forge-init
**Use on:** Any new project before first build session

**Steps:**
1. Scan entire codebase structure
2. Detect stack:
   - Frontend: React/Next.js/Vue/Svelte/vanilla
   - Backend: Express/Next API/Supabase/Convex/none
   - Database: Postgres/MySQL/SQLite/Supabase/MongoDB
   - ORM: Drizzle/Prisma/Mongoose/raw SQL
   - Auth: JWT/Clerk/NextAuth/Supabase Auth/custom
   - Deployment: Vercel/Railway/Render/Fly/custom
   - Existing services: Stripe/Resend/SendGrid/S3/R2/Twilio
3. Open NODE_LIBRARY.md
4. For each required app function, select correct node variant for detected stack
5. Select matching flowchart from .forge/flowcharts/ or generate new one
6. Generate PROJECT_STATE.md with full stack info and proposed build order
7. Present to human: detected stack + proposed node sequence
8. Wait for human approval before writing any code
9. On approval: set first node to ACTIVE in PROJECT_STATE.md

**Output:** PROJECT_STATE.md, approved build order, first node identified

---

## /forge-audit
**Use on:** Any existing project to classify what's built

**Steps:**
1. Scan all source files
2. For each feature found, classify as:
   - LOCKED: works completely, no errors, no compilation failures
   - INCOMPLETE: exists but has errors, type issues, or missing pieces
   - MISSING: not built at all
3. Map each feature to its node in NODE_LIBRARY.md
4. List all compilation/TypeScript errors
5. List all security issues visible in code
6. List missing critical dependencies between nodes
7. Generate PROJECT_STATE.md with full classification
8. Present findings — do not fix anything yet
9. Wait for human to confirm before proceeding

**Output:** Complete PROJECT_STATE.md with every node classified

---

## /forge-execute [node-name]
**Use on:** Any PENDING node whose dependencies are all LOCKED

**Steps:**
1. Read .forge/nodes/[node-name].md
2. Run confidence gate:
   - All dependencies LOCKED? If no — stop, report gap
   - All required inputs present? If no — stop, list missing inputs
   - Solution defined in node file? If no — stop, flag as gap
3. Execute INSTRUCTIONS exactly as written — no improvisation
4. Use SOLUTION specified — no substitutions
5. Run VALIDATION test
6. Pass: mark node LOCKED in PROJECT_STATE.md, log date
7. Fail attempt 1: apply first FAILURE MODE fix, re-run validation
8. Fail attempt 2: apply second FAILURE MODE fix, re-run validation
9. Fail attempt 3: run /forge-checkpoint, mark INCOMPLETE, report to human

**Output:** LOCKED node + updated PROJECT_STATE.md, or abort report

---

## /forge-validate [node-name]
**Use on:** Any node to check completion without executing

**Steps:**
1. Read VALIDATION section of node file only
2. Run each validation step exactly as written
3. Report binary pass/fail for each step
4. If all pass: lock the node
5. If any fail: report exact failure — do not attempt fix

**Output:** Pass/fail report per validation step

---

## /forge-gaps
**Use on:** Before building any novel or unclear requirement

**Steps:**
1. Read CONCEPT.md if it exists
2. List every required feature of the project
3. For each feature:
   - Is it covered by a LOCKED node? → covered
   - Is it covered by a PENDING node? → covered
   - Is it in NODE_LIBRARY.md? → covered
   - Can two existing nodes handle it combined? → recombination
   - Can an existing node handle it with different config? → configurable
   - None of the above? → genuine gap
4. Output three lists:
   - COVERED: existing nodes handle this
   - CONFIGURABLE: existing node + specific config
   - GENUINE GAPS: needs new node built
5. For each genuine gap: propose new node structure for human approval

**Output:** Gap report, new node proposals if needed

---

## /forge-concept
**Use on:** Any project with novel or unclear requirements before building

**Steps:**
1. Ask human exactly three questions:
   - What does this app do that standard apps don't?
   - Who are the actors? (every user type)
   - What are the unique interactions?
2. Write answers to .forge/concepts/CONCEPT.md
3. Run /forge-gaps automatically against answers
4. Present gap analysis to human
5. Get human approval on gap resolutions before any code

**Output:** CONCEPT.md + gap analysis + approved resolution plan

---

## /forge-rescue
**Use on:** Any stuck or broken project

**Steps:**
1. Run /forge-audit first — get full classification
2. List all INCOMPLETE nodes ordered by dependency
3. Fix foundational nodes first (nodes with no dependencies)
4. For each INCOMPLETE node:
   - Identify specific errors only — do not rewrite working code
   - Apply minimal fix to resolve the error
   - Run validation
   - Lock if passes, escalate if fails three times
5. Do not add features during rescue
6. Do not touch LOCKED nodes
7. Report when all INCOMPLETE nodes are LOCKED or escalated

**Output:** All INCOMPLETE nodes resolved or escalated with specific reasons

---

## /forge-checkpoint
**Use on:** Before any risky operation or on three-strike abort

**Steps:**
1. Stage all current changes
2. Commit: "FORGE checkpoint — pre-[node-name] — [date]"
3. Log commit hash in PROJECT_STATE.md FAILURE LOG
4. Confirm checkpoint before proceeding

**Output:** Git commit hash in PROJECT_STATE.md

---

## /forge-unlock [node-name] [reason]
**Use on:** When a LOCKED node genuinely needs modification

**Requirements:**
- Human must provide explicit reason
- Human must confirm downstream nodes may be affected
- Node returns to INCOMPLETE status
- All nodes in its LOCKED_BY list return to PENDING
- Must re-validate after any change

**Output:** Node unlocked, impact report showing affected downstream nodes

---

## /forge-status
**Use on:** Start of any session for quick orientation

**Output:**
```
CURRENT NODE:   [name]
LOCKED:         [count] nodes
INCOMPLETE:     [count] nodes  
PENDING:        [count] nodes
BLOCKING:       [list any hard blockers]
NEXT ACTION:    [single recommended action]
```

---

## /forge-add-node [node-name]
**Use on:** When /forge-gaps identifies a genuine gap needing a new node

**Steps:**
1. Human describes the function in plain language
2. Identify which existing solutions compose it (recombination first)
3. Draft node file using standard node structure
4. Present to human for approval
5. On approval: save to .forge/nodes/[node-name].md
6. Add entry to NODE_LIBRARY.md custom registry
7. Add to active flowchart in correct dependency position
8. Update PROJECT_STATE.md

**Output:** New node file + updated NODE_LIBRARY.md + updated flowchart

---

## FAILURE HANDLING RULES

**Attempt 1 fail:** Apply first FAILURE MODE from node file. Re-validate.
**Attempt 2 fail:** Apply second FAILURE MODE. Re-validate.
**Attempt 3 fail:**
```
FORGE ABORT: [node-name]
Attempts: 3
Last error: [exact error message]
Checkpoint: [git hash]
Recommended: [one specific suggestion]
Awaiting human instruction. Do not retry.
```

---

## END OF SESSION PROTOCOL

Every session ends with:
1. Update PROJECT_STATE.md — current node status
2. Log decisions in DECISIONS LOG
3. Log failures in FAILURE LOG
4. Note CURRENT NODE for next session
5. One-line summary: what completed, what is next
