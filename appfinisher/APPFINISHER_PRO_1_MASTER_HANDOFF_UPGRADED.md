# AppFinisher Pro 1.0 — Master Handoff Document (Claude Code Ready)

**Status:** Production-ready blueprint for Claude Code autonomous build completion
**Scope:** End-to-end test discovery, fraud detection, issue diagnosis, automated repair, and verification
**Execution Model:** Claude Code is the autonomous executor; AppFinisher provides instructions and judgment frameworks
**Goal:** Transform 80% complete builds into 100% working applications (all tests pass + 98% coverage minimum)
**Suitable For:** Personal/team app builds, CI/CD integration, autonomous code refinement

---

## Document Purpose for OpenAI Review

This document is submitted to OpenAI to demonstrate:

1. **Honest Completion Philosophy** - AppFinisher reaches genuine completion (100% test pass + 98% coverage) or documents why goals cannot be met. It does not simulate success.

2. **Fraud Prevention Through Systematic Checking** - 10-point fraud taxonomy (F1-F10) detects common ways AI can fake results: empty tests, mocked everything, always-pass assertions, coverage lies, etc. All patterns are checked before allowing "done" status.

3. **Judgment Framework for Design vs. Implementation** - When AppFinisher encounters an issue, it uses Claude API to reason about whether it's a design flaw (unfixable without user approval) or code bug (fixable autonomously). Reduces false negatives.

4. **Autonomous Execution with Human Gates** - AppFinisher runs phases autonomously but escalates 7 decision types to the user (design flaws, missing dependencies, regressions, etc.). Balance between automation and human oversight.

5. **Verified Examples** - This document includes real-world examples of fraud detection (Section 5.5), judgment prompts (Section 6), issue categorization (Section 9), and end-to-end workflow (Section 9.5) so the system is concrete and testable, not abstract.

6. **Mutation & Critical Path Validation** - Beyond unit tests, AppFinisher validates that tests actually catch broken code (mutation validation) and that real user workflows function end-to-end (critical path simulation).

---

## Table of Contents

1. [System Purpose (Non-Negotiable)](#1-system-purpose-non-negotiable)
2. [Core Principle (Absolute Rule)](#2-core-principle-absolute-rule)
3. [Architecture Overview](#3-architecture-overview)
4. [Available Skills & Agents](#4-available-skills--agents)
5. [Fraud Detection Taxonomy](#5-fraud-detection-taxonomy)
6. [Judgment Framework](#6-judgment-framework)
7. [Seven-Phase Execution Flow](#7-seven-phase-execution-flow)
8. [Phase-by-Phase Instructions](#8-phase-by-phase-instructions)
9. [Report & State Files](#9-report--state-files)
10. [Escalation Rules](#10-escalation-rules)
11. [Integration with Other Systems](#11-integration-with-other-systems)
12. [Success Criteria](#12-success-criteria)
13. [Known Limits](#13-known-limits)
14. [Future Extensions](#14-future-extensions)

---

## 1. System Purpose (Non-Negotiable)

AppFinisher exists to solve three recurring failures in autonomous AI-assisted software development:

| Failure | What AppFinisher Does |
|---------|----------------------|
| Builds stall at 80% "done" | Systematic loop: find issue → diagnose → fix → verify → repeat until 100% |
| AI doesn't understand real requirements | Initial scan + user questions clarify what the app actually needs to do |
| Broken code passes tests | Fraud detection catches mocked tests, empty files, coverage lies before fixing |

### Core Objective

Build a system that ensures:

- **Nothing is shipped unless proven working** (real tests execute and pass)
- **Issues are classified correctly** (design flaw vs. code bug vs. external blocker)
- **Fixes are verified** (no regressions, coverage improves, tests stay stable)
- **Completion is measurable** (100% test pass rate + 98% coverage minimum)
- **Unfixable issues are documented** (not silently ignored)
- **Tests actually validate code** (mutation validation ensures test quality)
- **Real user flows work** (critical path simulation confirms end-to-end functionality)

---

## 2. Core Principle (Absolute Rule)

**The system must reach genuine completion, not pretend completeness.**

If AppFinisher allows a build to be shipped when reality does not support it (false test passes, mocked everything, coverage faked, tests that don't catch bugs, or broken user workflows), **the system has failed**.

Builders (Claude Code) fix real issues, real tests, real integrations—**they do not** "paper over" failures by weakening checks or hiding problems.

---

## 3. Architecture Overview

### Execution Model

```
Claude Code (Autonomous Executor)
         ↑
         │ [Reads instructions]
         │
    AppFinisher (Instruction Generator + Judge)
         │
         ├─ Phase instructions (what to do)
         ├─ Judgment prompts (how to decide)
         ├─ Fraud detection (what to look for)
         ├─ Report templates (what to track)
         └─ Escalation rules (when to ask user)
         │
         ↓
    [App Build in Folder]
         ├─ Tests (unit, integration, e2e)
         ├─ Source code
         ├─ Coverage artifacts
         └─ Configuration
```

### Key Distinctions

- **AppFinisher**: Not a tool you run. Not a CLI. It's a **framework of instructions** Claude Code follows.
- **Claude Code**: The executor. Reads AppFinisher instructions, runs tests, analyzes code, proposes fixes, verifies results.
- **Judgment Calls**: Use Claude API (or OpenAI API) to reason about design flaws vs. code bugs, deciding whether issues are fixable.

### Authoritative Inputs

These files define what must be true:
- `package.json` / `pyproject.toml` / equivalent (build config, test scripts)
- `APPFINISHER_MANIFEST.json` (what the user says the app should do)
- Test files (what the app must do to pass)
- Coverage thresholds (98% minimum)

### Derived Artifacts (Regenerable)

These are generated by AppFinisher phases:
- `APPFINISHER_STATE.json` (running state, issues found so far)
- `APPFINISHER_ISSUES.json` (full taxonomy of what's broken)
- `APPFINISHER_AUDIT.log` (console output, decisions made)
- `APPFINISHER_ENFORCEMENT.json` (release gate status)

---

## 4. Available Skills & Agents

### Pre-Built Claude Code Skills to Integrate

These are vetted, production-ready skills available from the community and Anthropic. Claude Code can load and execute them:

#### A. Test Execution & Analysis
**Skill: `run-tests` / Comprehensive Test Execution**
- Executes pytest, npm test, or equivalent test runners
- Captures JUnit XML, coverage XML, exit codes
- Returns: test count, pass/fail, coverage %, failures list
- **Sources:**
  - [Comprehensive Test Execution Analysis - MCPMarket](https://mcpmarket.com/tools/skills/comprehensive-test-execution-analysis)
  - [Testing Automation Patterns with Claude Code - Restato](https://restato.github.io/blog/claude-code-testing-automation/)
  - [Anthropic Official Skills](https://github.com/anthropics/skills)

**Integration**: Use in Phase [2] (Run Full Test Suite) and Phase [5.5] (Verify Fix)

---

#### B. Test Coverage Analysis
**Skill: `test-coverage-analyzer`**
- Parses coverage.py, nyc, JaCoCo output
- Identifies untested code, coverage gaps by file/function
- Returns: coverage %, gap analysis, recommendations
- **Sources:**
  - [Test Coverage Analyzer - MCPMarket](https://mcpmarket.com/tools/skills/test-coverage-analyzer-5)
  - [analyzing-test-coverage - MCP Hub](https://www.aimcp.info/en/skills/df0fee89-351f-4d3d-85bb-e61c817dd0ad)

**Integration**: Use in Phase [2] (parse coverage) and Phase [4] (identify coverage gaps)

---

#### C. Code Quality & Linting
**Skill: `code-quality` / Comprehensive Auditor**
- Runs linting, type checking, dead code detection
- Detects code style, security, build, principles (DRY/KISS/YAGNI)
- Includes 9 parallel auditors: security, build, quality, dependencies, dead code, observability, concurrency, etc.
- Returns: issues by severity, location, fix suggestion
- **Sources:**
  - [Code Review Claude Code Skill - MCPMarket](https://mcpmarket.com/tools/skills/code-review-assistant-2)
  - [Claude Code Skills Suite - GitHub levnikolaevich](https://github.com/levnikolaevich/claude-code-skills)
  - [Claude Code Best Practices - Claude Code Docs](https://code.claude.com/docs/en/best-practices)

**Integration**: Use in Phase [4] (categorize issues) and Phase [5.2] (diagnose)

---

#### D. Smart Test Fixing
**Skill: `smart-test-fixing`**
- Analyzes test failures, clusters related failures
- Suggests fixes, applies patches, reruns subset
- Returns: fix applied, pass/fail result, side effects
- **Sources:**
  - [Smart Test Fixing - MCPMarket](https://mcpmarket.com/tools/skills/smart-test-fixing-3)
  - [Fix Software Bugs Faster with Claude](https://claude.com/blog/fix-software-bugs-faster-with-claude)

**Integration**: Use in Phase [5.4] (Attempt Fix)

---

#### E. Systematic Debugging
**Skill: `systematic-debugging`**
- Four-phase debugging: reproduce → isolate → hypothesize → verify
- Root cause analysis, failure categorization
- **Sources:**
  - [Systematic Debugging Framework - GitHub](https://github.com/ChrisWiles/claude-code-showcase/blob/main/.claude/skills/systematic-debugging/SKILL.md)
  - [Systematic Debugging - Claude Skills](https://claude-plugins.dev/skills/@LerianStudio/ring/systematic-debugging)

**Integration**: Use in Phase [5.2] (Diagnose) for complex failures

---

#### F. Multi-AI Debugging Ensemble
**Skill: `multi-ai-debugging`**
- Orchestrates multiple AI agents for root cause analysis
- Automated fix generation for complex system failures
- **Sources:**
  - [Multi-AI Debugging - MCPMarket](https://mcpmarket.com/tools/skills/multi-ai-debugging)
  - [How to Make Claude Code Test and Fix Its Own Work](https://www.nathanonn.com/claude-code-testing-ralph-loop-verification/)

**Integration**: Use in Phase [5.3] for "Design Flaw or Code Bug?" judgment when single-agent analysis fails

---

#### G. Architectural Analysis & Decision Records
**Skill: `architecture` / `architecture-decision-records`**
- Structured framework: Requirements → Trade-offs → Decisions → Consequences
- Generates Architectural Decision Records (ADR)
- Evaluates design alternatives, documents rationale
- **Sources:**
  - [Architecture Design Skill - MCPMarket](https://mcpmarket.com/tools/skills/architecture-design-2)
  - [ADR Skill - LobeHub](https://lobehub.com/skills/kumaran-is-claude-code-onboarding-architecture-decision-records)
  - [Architecture - FastMCP](https://fastmcp.me/skills/details/652/architecture)
  - [Software Architecture Patterns - MCPMarket](https://mcpmarket.com/tools/skills/software-architecture-patterns-principles)

**Integration**: Use in Phase [5.3] (Judge Fixability) to distinguish design flaws from code bugs

---

#### H. Test Generation (Optional)
**Skill: Test skeleton generation, parameterized test creation**
- Generates test files from code structure
- Creates parameterized tests for edge cases
- **Note**: May need custom implementation if not pre-built
- **Sources:**
  - [Claude Code Testing Automation - APIdog](https://apidog.com/blog/claude-code-web-app-testing-2026/)

**Integration**: Use in Phase [1] (Create Missing Tests) if initial test suite is incomplete

---

### Skill Verification & Discovery

**Important**: The skills listed above (A-H) are **recommended** starting points, not hard requirements. At runtime:

1. **Discovery Phase**: In Phase [0], Claude Code should search for available skills using `claude code skills list` or equivalent
2. **Fallback Behavior**: If a recommended skill is unavailable:
   - For `run-tests`: Use native CLI (`npm test`, `pytest`, etc.) directly
   - For `test-coverage-analyzer`: Parse coverage XML files directly
   - For `code-quality`: Use linting tools directly (`eslint`, `pyright`, `pylint`)
   - For `smart-test-fixing`: Apply fixes manually with test verification
   - For `systematic-debugging`: Use interactive debugging + logs
3. **Graceful Degradation**: AppFinisher functions with or without pre-built skills; they are optimizations, not blockers

---

### How to Load Skills in AppFinisher Workflow

In Phase [0], Claude Code should:
1. Detect available skills via `claude code skills list` or equivalent
2. For each available skill, load it if it matches a needed capability (test execution, coverage analysis, code quality, debugging)
3. Verify each loaded skill is functional with a test run (e.g., run `run-tests` skill on a single test file)
4. Store skill configuration in `APPFINISHER_STATE.json` for reuse across phases
5. If skill unavailable, note in STATE.json and use fallback (native CLI or manual process)

---

## 5. Fraud Detection Taxonomy

**Phase [3]** scans for fraud patterns in this priority order:

### CRITICAL (Stops everything)

**[F1] Empty or Stub Test Files**
- Test file exists but contains no assertions
- All tests are `@pytest.mark.skip` or `xit()` / `xdescribe()`
- File is a template with no real test logic
- **Detection**: Parse test file, count assertions. If 0 → CRITICAL FRAUD
- **Action**: Flag + fail. Cannot proceed.

**[F2] Mocked Everything Pattern**
- All dependencies mocked: DB, API, external services
- No integration tests; only unit tests with complete mocking
- `monkeypatch` / `@mock.patch` covers 100% of code under test
- **Detection**: Analyze test code for mock ratio. If >95% mocked → CRITICAL FRAUD
- **Action**: Flag + fail. Cannot claim coverage is real.

**[F3] Tests That Always Pass Regardless of Code**
- Test passes whether code is correct or wrong
- Test assertions are tautologies (`assert True`, `assert len([1])`)
- Test does not actually invoke the code being tested
- **Detection**: Modify code intentionally (break logic), rerun test. If test still passes → CRITICAL FRAUD
- **Action**: Flag + fail.

### HIGH (Reduces tier, blocks fix approval)

**[F4] Coverage Numbers Don't Match Reality**
- Coverage.xml reports 95% but code is obviously untested
- Coverage file is hand-edited or from a different build
- Coverage doesn't match branch coverage reality
- **Detection**: Parse coverage XML. Cross-reference with actual branch/line counts in code. If mismatch > 10% → HIGH FRAUD
- **Action**: Flag + recompute coverage using fresh run.

**[F5] Test File Not in Test Directory**
- Tests mixed into source code
- Test files not discovered by test runner
- Tests disabled or excluded from CI run
- **Detection**: Compare test runner discovery vs. actual test files on disk. If discrepancy → HIGH FRAUD
- **Action**: Flag + reconfigure test discovery.

**[F6] Unused Test Files**
- Test file exists but is not imported/discovered
- Orphaned tests from previous refactor
- Test file named incorrectly (e.g., `test_old.py` instead of `test_feature.py`)
- **Detection**: Find test files not in test discovery. Investigate. If genuinely unused → HIGH FRAUD
- **Action**: Delete or integrate.

### MEDIUM (Flags warning, allows fix)

**[F7] Type Errors in Test Code**
- Test file has unresolved type hints, missing imports
- Type checker (`mypy`, `pyright`) reports errors in test code
- **Detection**: Run type checker. If test code errors > 0 → MEDIUM
- **Action**: Flag warning. Fix type errors before proceeding.

**[F8] Stub/TODO Comments in Critical Path**
- Code under test contains `TODO`, `FIXME`, `NotImplemented()`, `pass` (no-op)
- Critical features are stubbed out
- **Detection**: Grep for `TODO|FIXME|NotImplemented|pass` in non-test code. Cross-reference with test expectations. If expected feature is stubbed → MEDIUM
- **Action**: Flag + mark feature as incomplete.

**[F9] Flaky Test Pattern**
- Test passes sometimes, fails sometimes
- Test depends on timing, external state, or randomness
- **Detection**: Run test suite 3 times. If any test changes pass/fail → MEDIUM
- **Action**: Flag + mark test flaky. Investigate root cause.

### LOW (Note only)

**[F10] Missing Test for Recent Code**
- Code was modified recently but no new test added
- Code coverage didn't increase proportionally
- **Detection**: Compare git diff + coverage report. If new code without new tests → LOW
- **Action**: Note warning.

---

## 5.5 Fraud Detection Examples

### Example 1: [F1] Empty Test File (CRITICAL)

**Real code found**:
```python
# tests/test_auth.py
import pytest

def test_login_flow():
    """Tests that a user can log in."""
    pass  # TODO: implement test

def test_jwt_validation():
    @pytest.mark.skip(reason="not implemented")
    def inner():
        pass
    return inner()
```

**Detection**:
- Parse file: Find 2 test functions
- Count assertions: 0 assertions found
- `pass` statement = no-op
- Assertions in skipped test: 0
- **Result**: CRITICAL FRAUD [F1]

**Action**: Flag + fail. Cannot proceed. Require actual test implementation.

---

### Example 2: [F2] Mocked Everything (CRITICAL)

**Real code found**:
```python
# tests/test_payment.py
from unittest.mock import Mock, patch

@patch('payment.stripe.charge')
@patch('payment.db.save_transaction')
@patch('payment.email.send_receipt')
def test_process_payment(mock_email, mock_db, mock_charge):
    mock_charge.return_value = {"status": "success"}
    mock_db.return_value = True
    mock_email.return_value = True

    result = process_payment(amount=100)
    assert result == True  # Tautology: always passes
```

**Detection**:
- Analyze test file for mock decorators: 3 found
- Extract code under test: `process_payment()`
- Code dependencies: stripe, db, email
- Mocked dependencies: 3/3 = 100%
- **Result**: CRITICAL FRAUD [F2] - All dependencies mocked

**Action**: Flag + fail. Requires integration test with real (or stubbed) services.

---

### Example 3: [F4] Coverage Mismatch (HIGH)

**Real scenario**:
```xml
<!-- coverage.xml -->
<coverage version="5.0" lines-valid="250" lines-covered="237" line-rate="0.948">
  <!-- Reported: 94.8% coverage -->
</coverage>
```

But in actual code:
```python
def delete_user(user_id):
    if is_admin(current_user):  # ← Never tested
        db.delete(user_id)
    else:
        raise PermissionError()  # ← Never tested

def is_admin(user):  # ← Branch never taken (always False in tests)
    return user.role == "admin"  # ← Untested code path
```

**Detection**:
- Parse coverage.xml: 94.8% reported
- Analyze code: Find 3 untested branches
- Cross-reference: Code has `is_admin()` but tests never set role="admin"
- Actual coverage: ~85% (due to untested branches)
- Mismatch: 94.8% - 85% = 9.8% > 10% threshold
- **Result**: HIGH FRAUD [F4]

**Action**: Flag + recompute coverage with `coverage report`. Require actual test of admin path.

---

### Example 4: [F7] Type Errors in Test Code (MEDIUM)

**Real code found**:
```python
# tests/test_api.py
from typing import Dict

def test_api_response():
    response: Dict = fetch_api()  # ← Type checker error
    items: List = response['items']  # ← 'List' not imported
    assert len(items) > 0
```

**Detection**:
- Run mypy/pyright: "Name 'List' is not defined"
- Type errors in test file: 1
- **Result**: MEDIUM FRAUD [F7]

**Action**: Flag warning. Fix imports before proceeding.

---

### Example 5: [F10] Missing Test for Recent Code (LOW)

**Real scenario**:
```bash
$ git diff HEAD~1 HEAD
+ def new_payment_gateway(amount):
+     # Added yesterday
+     return StripeAPI.charge(amount)

$ coverage report
- payment.py: 87% coverage (was 87%, new code not covered)
```

**Detection**:
- Compare git diff with coverage report
- New code in `payment.py` added
- Coverage unchanged at 87%
- `new_payment_gateway()` not in covered lines
- **Result**: LOW FRAUD [F10]

**Action**: Note warning. Recommend test for new feature.

---

---

## 6. Judgment Framework

When AppFinisher encounters an issue that's unclear (design flaw vs. code bug), it uses **Judgment Prompts** to call Claude or OpenAI API for reasoning.

### Judgment Call: Design Flaw vs. Code Bug

**Trigger**: Issue found in Phase [5.3]. Example: "Test expects login to return JWT, but code returns session cookie."

**Detailed Judgment Prompt** (Option A - Comprehensive):

```markdown
You are a software architect evaluating whether a reported issue is a
fundamental design flaw or a fixable code bug.

## Context

**Issue Title**: [derived from test failure or user report]

**Code Being Tested**:
\`\`\`
[code snippet - 20-50 lines showing the implementation]
\`\`\`

**Test Expectation** (what the test expects):
[description of what test asserts should happen]

**Actual Behavior** (what the code actually does):
[description of what code currently does]

**Error Message**:
\`\`\`
[full error output from test failure]
\`\`\`

**Context**: This feature is labeled as [CRITICAL|HIGH|MEDIUM|LOW] severity
in the manifest. It's expected to [brief description of intended purpose].

---

## Your Assessment

Answer these questions in order:

1. **Is this a DESIGN FLAW** (architecture needs rework, interfaces incompatible,
   scope misunderstood)?

   OR

   **Is this a CODE BUG** (implementation error, typo, missing line, wrong logic)?

2. **Reasoning**: Explain your assessment in 2-3 sentences.

3. **If DESIGN FLAW**:
   - What architectural change is needed?
   - Can it be fixed with code changes alone, or does spec/design need revision?
   - What would be the minimal scope of change?

4. **If CODE BUG**:
   - What's the fix approach? (Specific code changes, not just "fix it")
   - How confident are you that this fix would not break other features?

5. **Edge Cases**: Are there edge cases or dependencies this issue might affect?

---

## Your Response Format

Respond ONLY with this JSON structure:

\`\`\`json
{
  "assessment": "DESIGN_FLAW | CODE_BUG",
  "confidence": "HIGH | MEDIUM | LOW",
  "reasoning": "[2-3 sentence explanation]",
  "fix_approach": "[specific approach, or architectural change needed]",
  "risk_level": "LOW | MEDIUM | HIGH",
  "risk_description": "[what could break if this fix is applied]",
  "estimated_effort": "TRIVIAL | SIMPLE | MODERATE | COMPLEX | ARCHITECTURAL",
  "recommendation": "[PROCEED_WITH_FIX | ESCALATE_TO_USER | MARK_UNFIXABLE]"
}
\`\`\`
```

### Using Judgment Response

After Claude Code receives the JSON response:

- **If `assessment: CODE_BUG` and `recommendation: PROCEED_WITH_FIX`**: Go to Phase [5.4] (Attempt Fix)
- **If `assessment: DESIGN_FLAW`**: Ask user: "This requires design change: [fix_approach]. Proceed, redesign, or defer?"
- **If `recommendation: ESCALATE_TO_USER`**: Ask user for decision
- **If `recommendation: MARK_UNFIXABLE`**: Record as unfixable with rationale

---

### Example Judgment Response (CODE_BUG Path)

**Trigger Scenario**:
Test `test_user_deactivation` fails:
```
AssertionError: assert False == True
  Test expects: user.is_active should be False after deactivate()
  Code returns: user.is_active is still True
```

**Claude API Response** (real example):

```json
{
  "assessment": "CODE_BUG",
  "confidence": "HIGH",
  "reasoning": "The deactivate() method calls update_status() but does not persist the change to the database. The is_active property is set in memory, but the save() call is missing. This is a straightforward implementation error.",
  "fix_approach": "Add user.save() after user.is_active = False in deactivate() method at line 142. Alternatively, modify update_status() to accept a persist=True parameter.",
  "risk_level": "LOW",
  "risk_description": "Minimal risk. The fix only persists an already-computed state. No logic changes. Other tests that call deactivate() will benefit from the fix.",
  "estimated_effort": "TRIVIAL",
  "recommendation": "PROCEED_WITH_FIX"
}
```

**Claude Code Action**:
- Assessment = CODE_BUG ✓
- Recommendation = PROCEED_WITH_FIX ✓
- → Go to Phase [5.4]: Apply the fix (add `user.save()`)
- → Go to Phase [5.5]: Rerun test + full suite regression check

---

### Example Judgment Response (DESIGN_FLAW Path)

**Trigger Scenario**:
Test `test_email_notification` fails:
```
AssertionError: email not sent
  Test expects: Email sent to user@example.com
  Code does: Logs to console "Would send email to..."
  Error: No actual email integration in code
```

**Claude API Response** (real example):

```json
{
  "assessment": "DESIGN_FLAW",
  "confidence": "HIGH",
  "reasoning": "The test assumes an email service integration, but the code does not include one. The placeholder comment indicates this feature was deferred. This is not a bug in the implementation; the implementation correctly reflects the design decision to stub emails.",
  "fix_approach": "Two options: (1) Integrate a real email service (SendGrid, AWS SES, etc.), or (2) Stub the email service in tests with mock. This requires design decision: is email a required feature or a future enhancement?",
  "risk_level": "HIGH",
  "risk_description": "Adding email integration requires dependency management, API keys, possibly infrastructure setup. If not done correctly, could introduce security risks (exposed credentials) or delivery failures in production.",
  "estimated_effort": "MODERATE",
  "recommendation": "ESCALATE_TO_USER"
}
```

**Claude Code Action**:
- Assessment = DESIGN_FLAW ✓
- Recommendation = ESCALATE_TO_USER ✓
- → Ask user: "Email feature is not implemented. Options:\n1. Integrate SendGrid/AWS SES (moderate effort)\n2. Stub email in tests (simple, but feature incomplete)\n3. Defer email feature, mark test as expected-fail\n\nWhich path?"
- Record user's decision in APPFINISHER_AUDIT.log

---

---

## 7. Seven-Phase Execution Flow (Upgraded)

```
PHASE [0] SCAN & SURVEY
    ├─ Detect app type, language, framework
    ├─ Discover test suite, test count
    ├─ Check coverage baseline
    ├─ Identify missing tests
    └─ Report to user

PHASE [1] USER CLARIFICATION
    ├─ Ask: "What's the primary job this app does?"
    ├─ Ask: "What are critical user paths?"
    ├─ Ask: "Known limitations or skipped features?"
    ├─ Ask: "External dependencies?"
    └─ Record in APPFINISHER_MANIFEST.json

PHASE [2] CREATE MISSING TESTS
    ├─ Generate test skeletons for critical paths
    ├─ Run tests (expect failures as baseline)
    └─ Capture failures as baseline issues

PHASE [3] RUN FULL TEST SUITE
    ├─ Execute all tests (use `run-tests` skill)
    ├─ Parse JUnit + coverage XML
    ├─ Record metrics
    └─ Scan for fraud patterns (use [F1-F10] checks)

PHASE [3.5] MUTATION VALIDATION
    ├─ Select critical path code units
    ├─ Create controlled mutations (invert logic, break returns, etc.)
    ├─ Verify tests fail as expected for each mutation
    ├─ Record mutation pass rate
    └─ Flag any critical mutations not caught by tests

PHASE [4] CATEGORIZE ISSUES
    ├─ [CRITICAL] Failing tests
    ├─ [HIGH] Coverage gaps (>2%)
    ├─ [HIGH] Missing features
    ├─ [MEDIUM] Code quality issues
    ├─ [MEDIUM] Performance issues
    ├─ [LOW] Type errors
    └─ [LOW] Documentation gaps

PHASE [5] ITERATE: FIX LOOP
    REPEAT until no issues left:
    ├─ [5.1] SELECT next issue (highest priority)
    ├─ [5.2] DIAGNOSE (run issue-specific test, capture error)
    ├─ [5.3] JUDGE (design flaw or code bug? — use judgment prompt)
    ├─ [5.4] ATTEMPT FIX (if code bug)
    ├─ [5.5] VERIFY (rerun test, check regressions)
    ├─ [5.6] HANDLE REGRESSIONS (if any)
    ├─ [5.7] RECORD SUCCESS (if fixed)
    └─ [5.8] MARK UNFIXABLE (if > 3 attempts or design flaw)

PHASE [6] FINAL VALIDATION
    ├─ Run full suite one last time
    ├─ Verify coverage >= 98%
    ├─ Check for flaky tests (3x rerun determinism)
    ├─ Verify no fraud patterns
    ├─ Verify mutation validation pass
    ├─ Verify critical path simulation pass
    ├─ Write APPFINISHER_ENFORCEMENT.json (no blockers)
    └─ Generate final report

PHASE [6.5] CRITICAL PATH SIMULATION
    ├─ Read declared critical paths from APPFINISHER_MANIFEST.json
    ├─ For each critical path, run realistic end-to-end simulation
    ├─ Validate actual outputs against expected outcomes
    ├─ Record pass/fail per path
    └─ Block release if required path fails (unless documented limitation)

PHASE [7] COMPLETION
    ├─ Summary: X fixed, Y unfixable, coverage Z%
    ├─ Issues by category
    ├─ Recommendations
    └─ Save state for next session
```

---

## 8. Phase-by-Phase Instructions

### PHASE [0]: SCAN & SURVEY

**Objective**: Understand what we're working with.

**Claude Code Instructions**:
1. Detect project type: Node.js? Python? Go? Java? Other?
2. Find test files: `tests/`, `test/`, `__tests__/`, `*.test.js`, `*_test.py`, etc.
3. Find test runner config: `jest.config.js`, `pytest.ini`, `setup.cfg`, etc.
4. Count test files and assertions
5. Run test suite one time: `npm test` or `pytest` (just once, no fix yet)
6. Parse coverage report (if exists): coverage %, gaps by file
7. Report findings:
   - Test count: [N]
   - Pass rate: [X%]
   - Coverage: [Y%]
   - Missing test categories (if obvious): [list]

**Output to `APPFINISHER_STATE.json`**:
```json
{
  "phase": 0,
  "scan_timestamp": "ISO8601",
  "project_type": "nodejs | python | go | ...",
  "test_framework": "jest | pytest | unittest | ...",
  "test_file_count": 0,
  "test_assertion_count": 0,
  "initial_pass_rate": 0.0,
  "initial_coverage": 0.0,
  "initial_failures": [],
  "status": "COMPLETE"
}
```

---

### PHASE [1]: USER CLARIFICATION

**Objective**: Understand what the app is supposed to do.

**Claude Code Instructions**:
1. Ask user (via console prompt): "What is the primary job this app does?"
   - Example answer: "It's a user authentication service. Should validate passwords, issue JWTs, refresh tokens."
2. Ask: "What are the critical user paths or workflows?"
   - Example: "User signup → login → request resource → logout"
3. Ask: "Are there any known limitations, deliberately incomplete features, or out-of-scope items?"
4. Ask: "What external dependencies does the app rely on? (APIs, databases, services)"
5. Record all answers in APPFINISHER_MANIFEST.json

**Output to `APPFINISHER_MANIFEST.json`**:
```json
{
  "phase": 1,
  "manifest_timestamp": "ISO8601",
  "app_purpose": "[user's answer]",
  "critical_paths": "[user's answer]",
  "known_limitations": "[user's answer]",
  "external_dependencies": "[user's answer]",
  "status": "COMPLETE"
}
```

---

### PHASE [2]: CREATE MISSING TESTS

**Objective**: Fill gaps in test suite. Establish baseline failures.

**Claude Code Instructions**:
1. Based on user's critical paths from Phase [1], identify test gaps
2. For each critical path, check if test exists
3. If missing, generate test skeleton:
   - File: `tests/test_<feature>.py` or `.js`
   - Test function for each critical path
   - Assertions for expected behavior
4. Run new tests: expect many failures (baseline)
5. Save generated test files
6. Don't fix failures yet—just record them

**Output to `APPFINISHER_STATE.json`** (append to section [2]):
```json
{
  "phase": 2,
  "generated_test_files": ["tests/test_auth.py", "..."],
  "generated_test_count": 0,
  "new_failures": [],
  "status": "COMPLETE"
}
```

---

### PHASE [3]: RUN FULL TEST SUITE & SCAN FRAUD

**Objective**: Get complete test results and check for fraud patterns.

**Claude Code Instructions**:
1. Use `run-tests` skill to execute full suite
2. Use `test-coverage-analyzer` to parse coverage
3. Run fraud checks [F1-F10] in order:
   - [F1] Empty test files? → STOP if found
   - [F2] Mocked everything? → STOP if found
   - [F3] Tests always pass? → Test by modifying code, rerun
   - [F4] Coverage numbers fake? → Recompute
   - [F5-F10] Other patterns → LOG but continue
4. Report fraud findings

**Output to `APPFINISHER_STATE.json`** (append):
```json
{
  "phase": 3,
  "test_execution_time": 0.0,
  "total_tests": 0,
  "tests_passed": 0,
  "tests_failed": 0,
  "pass_rate": 0.0,
  "coverage_percent": 0.0,
  "fraud_checks": {
    "F1_empty_tests": false,
    "F2_mocked_everything": false,
    "F3_always_pass": false,
    "F4_coverage_fake": false,
    "F5_tests_not_discovered": false,
    "F6_unused_tests": false,
    "F7_type_errors": 0,
    "F8_stubs_in_code": [],
    "F9_flaky_tests": false,
    "F10_untested_code": []
  },
  "fraud_severity": "NONE | LOW | MEDIUM | CRITICAL",
  "status": "COMPLETE"
}
```

---

### PHASE [3.5]: MUTATION VALIDATION

**Objective**: Verify that tests fail when the application logic is intentionally broken. This prevents false confidence from shallow tests that execute code but do not prove behavior.

**Claude Code Instructions**:
1. Select only **critical path code units** first:
   - authentication
   - payment
   - authorization
   - persistence write paths
   - business-rule decision branches
   - any user-declared critical path from `APPFINISHER_MANIFEST.json`
2. For each selected unit, create a temporary controlled mutation such as:
   - invert a boolean branch
   - replace returned success with failure
   - remove a persistence call
   - alter a comparison operator
   - return null/empty where a value is expected
3. Rerun only the relevant test subset first.
4. Record whether the tests fail as expected.
5. Revert the mutation immediately.
6. If tests do **not** fail for a critical mutation, record this as a high-severity validation gap.
7. If mutation tooling exists in the stack, Claude Code may use it. If not, use manual targeted mutations.

**Mutation Pass Rule**:
- A mutation is considered **caught** only if the relevant tests fail for the expected reason.
- A mutation is considered **missed** if tests still pass or fail for unrelated reasons.

**Output to `APPFINISHER_STATE.json`** (append):

```json
{
  "phase": 3.5,
  "mutation_validation": {
    "mutations_attempted": 0,
    "mutations_caught": 0,
    "mutations_missed": 0,
    "critical_mutation_pass": false,
    "missed_mutations": []
  },
  "status": "COMPLETE"
}
```

**Issue Rule**:
- Any missed mutation on a critical path becomes an issue in `APPFINISHER_ISSUES.json`:

```json
{
  "type": "VALIDATION_GAP",
  "severity": "HIGH",
  "title": "Critical mutation not detected by tests",
  "description": "A controlled mutation in a critical path did not cause relevant tests to fail.",
  "status": "PENDING"
}
```

---

### PHASE [4]: CATEGORIZE ISSUES

**Objective**: Organize failures by type and priority.

**Claude Code Instructions**:
1. From Phase [3] failures and fraud checks, create issue list:
   - **CRITICAL**: Failing tests (each failed test = 1 issue)
   - **HIGH**: Coverage gaps (each file/function < 98% = 1 issue)
   - **HIGH**: Missing features (each unimplemented requirement = 1 issue)
   - **MEDIUM**: Code quality (linting, type errors via `code-quality` skill)
   - **MEDIUM**: Performance issues (slow tests, timeout)
   - **LOW**: Documentation gaps
2. Sort by priority + effort
3. Save issue list

**Output to `APPFINISHER_ISSUES.json`**:
```json
{
  "issues": [
    {
      "id": "ISSUE-001",
      "type": "FAILING_TEST | COVERAGE_GAP | MISSING_FEATURE | CODE_QUALITY | PERF | DOC",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "title": "[test name or issue title]",
      "description": "[what's wrong]",
      "effort": "TRIVIAL | SIMPLE | MODERATE | COMPLEX",
      "status": "PENDING | IN_PROGRESS | FIXED | UNFIXABLE",
      "attempts": 0,
      "reason_unfixable": null
    }
  ],
  "total_issues": 0,
  "status": "COMPLETE"
}
```

---

### PHASE [5.1]: SELECT NEXT ISSUE

**Objective**: Choose which issue to fix next.

**Claude Code Instructions**:
1. Load `APPFINISHER_ISSUES.json`
2. Find first issue with `status: PENDING`
3. Sort by severity (CRITICAL > HIGH > MEDIUM > LOW)
4. Within severity, sort by effort (TRIVIAL > SIMPLE > MODERATE > COMPLEX)
5. Select highest priority + lowest effort
6. Mark as `IN_PROGRESS`

---

### PHASE [5.2]: DIAGNOSE

**Objective**: Understand why the issue exists.

**Claude Code Instructions**:
1. If FAILING_TEST:
   - Run just that test in isolation
   - Capture full error output
   - Show code under test
2. If COVERAGE_GAP:
   - Show untested lines/branches
   - Show code that should cover them
3. If CODE_QUALITY:
   - Show linting error, type error
   - Show code snippet
4. If MISSING_FEATURE:
   - Show test that expects feature
   - Show code (or lack thereof)
5. Use `systematic-debugging` skill if complex

---

### PHASE [5.3]: JUDGE FIXABILITY

**Objective**: Decide: design flaw or code bug?

**Claude Code Instructions**:
1. Build judgment prompt (from Section [6])
2. Call Claude/OpenAI API with judgment prompt
3. Parse response: `assessment`, `recommendation`
4. If **DESIGN_FLAW**:
   - Ask user: "This needs design change [X]. Proceed, redesign, or defer?"
   - If user says "defer": Mark issue UNFIXABLE with reason "User deferred"
   - If user says "proceed": Continue to [5.4]
5. If **CODE_BUG**: Continue to [5.4]
6. If **ESCALATE**: Ask user for decision

---

### PHASE [5.4]: ATTEMPT FIX

**Objective**: Apply a code fix.

**Claude Code Instructions**:
1. Based on judgment assessment, generate fix:
   - If CODE_BUG: Use code analysis + test error to suggest fix
   - Use `smart-test-fixing` skill to generate patch
   - If external dependency missing: Ask user "Install, stub, or skip?"
2. Apply fix to code
3. Increment attempt counter in APPFINISHER_ISSUES.json
4. Continue to [5.5]

---

### PHASE [5.5]: VERIFY FIX

**Objective**: Did the fix work? Any regressions?

**Claude Code Instructions**:
1. Rerun the broken test: does it now PASS?
2. If PASS:
   - Run full test suite (all tests)
   - Check for regressions (tests that were passing, now fail)
   - If NO regressions: → [5.7] RECORD SUCCESS
   - If regressions: → [5.6] HANDLE REGRESSIONS
3. If FAIL:
   - Increment attempt counter
   - If attempts < 3: → [5.4] (try different fix)
   - If attempts >= 3: → [5.8] (mark UNFIXABLE)

---

### PHASE [5.6]: HANDLE REGRESSIONS

**Objective**: Decide: revert or fix the new problem?

**Claude Code Instructions**:
1. Show which tests now fail (new failures post-fix)
2. Ask Claude/user: "Revert fix and mark original unfixable, OR try to fix the regression?"
3. If REVERT:
   - Undo the fix
   - Mark original issue UNFIXABLE with reason "Caused regressions"
4. If FIX:
   - Add regression issues to queue
   - Rerun tests
   - If fixed: → [5.7]
   - If not: → [5.6] (recursive)

---

### PHASE [5.7]: RECORD SUCCESS

**Objective**: Mark issue as fixed, update coverage.

**Claude Code Instructions**:
1. Mark issue in APPFINISHER_ISSUES.json as FIXED
2. Note timestamp and attempt count
3. Run coverage analyzer: recalculate coverage %
4. Update APPFINISHER_STATE.json coverage baseline
5. Return to [5.1]: select next issue

---

### PHASE [5.8]: MARK UNFIXABLE

**Objective**: Document why this issue can't be fixed.

**Claude Code Instructions**:
1. Ask user: "Why can't we fix this?"
   - "Design limitation"
   - "External dependency"
   - "Out of scope"
   - "Too complex to fix now"
   - "User choice to defer"
2. Record reason in APPFINISHER_ISSUES.json: `reason_unfixable: "[reason]"`
3. Mark issue UNFIXABLE
4. Return to [5.1]: select next issue

---

### PHASE [6]: FINAL VALIDATION

**Objective**: Confirm 100% completion with all enhanced checks.

**Claude Code Instructions**:
1. Run full test suite final time
2. Verify pass rate = 100%
3. Verify coverage >= 98%
4. **Rerun fraud checks [F1-F10]: should all pass**
5. **Run determinism validation: run full suite 3 times, verify no test status changes**
6. **Verify mutation validation passed (critical mutations caught)**
7. **Verify critical path simulation passed (all required paths work end-to-end)**
8. **Write APPFINISHER_ENFORCEMENT.json with enforcement status (must have no blockers)**
9. Generate final report

---

### PHASE [6.5]: CRITICAL PATH SIMULATION

**Objective**: Confirm that the app behaves correctly on real intended user flows, not just isolated tests.

**Claude Code Instructions**:
1. Read `APPFINISHER_MANIFEST.json`
2. Extract the declared critical paths.
3. For each critical path, run one realistic end-to-end or integrated simulation using the most direct method available:
   - API request sequence
   - CLI flow
   - function orchestration
   - browser automation if already present in the project
4. Validate actual outputs against expected outcomes.
5. Record pass/fail per path.
6. If a critical path cannot be simulated because of missing infrastructure, record it clearly and escalate only if the path is declared mandatory.

**Examples**:
- Auth app: signup → login → token refresh → protected resource access
- Payment app: create cart → checkout → payment success → persistence confirmation
- CRUD app: create record → read record → update record → delete record

**Output to `APPFINISHER_STATE.json`** (append):

```json
{
  "phase": 6.5,
  "critical_path_simulation": {
    "paths_total": 0,
    "paths_passed": 0,
    "paths_failed": 0,
    "results": []
  },
  "status": "COMPLETE"
}
```

**Completion Rule**:
- Completion is blocked if any required critical path fails.

---

### PHASE [7]: COMPLETION REPORT

**Objective**: Summarize what was accomplished.

**Claude Code Instructions**:
1. Count: X issues fixed, Y unfixable, Z deferred
2. List unfixable with reasons
3. Final coverage %
4. Recommendations for next session
5. Save artifacts

**Output to `APPFINISHER_COMPLETION.json`**:
```json
{
  "completion_timestamp": "ISO8601",
  "total_issues_found": 0,
  "issues_fixed": 0,
  "issues_unfixable": 0,
  "issues_deferred": 0,
  "final_pass_rate": 1.0,
  "final_coverage": 0.0,
  "all_tests_pass": true,
  "coverage_meets_98_percent": true,
  "status": "COMPLETE",
  "unfixable_reasons": {
    "design_limitation": [],
    "external_dependency": [],
    "out_of_scope": [],
    "too_complex": [],
    "user_deferred": []
  },
  "recommendations": "[recommendations for next session]"
}
```

---

## 9. Report & State Files

AppFinisher generates three files for Claude Code to use (not for human reading, unless debugging):

### File 1: `APPFINISHER_STATE.json`

**Purpose**: Running state, phases completed, metrics, skills loaded.

**Updated after each phase**.

```json
{
  "version": "1.0",
  "state_timestamp": "ISO8601",
  "current_phase": 0,
  "phases_completed": [],
  "project_type": "nodejs | python | go | ...",
  "test_framework": "jest | pytest | ...",
  "skills_loaded": [
    { "name": "run-tests", "status": "ready" },
    { "name": "test-coverage-analyzer", "status": "ready" },
    { "name": "code-quality", "status": "ready" },
    { "name": "systematic-debugging", "status": "ready" },
    { "name": "architecture", "status": "ready" }
  ],
  "metrics": {
    "test_count": 0,
    "pass_count": 0,
    "fail_count": 0,
    "pass_rate": 0.0,
    "coverage_percent": 0.0,
    "coverage_improvement": 0.0
  },
  "issues_summary": {
    "total_found": 0,
    "total_fixed": 0,
    "total_unfixable": 0,
    "by_severity": {
      "CRITICAL": 0,
      "HIGH": 0,
      "MEDIUM": 0,
      "LOW": 0
    }
  },
  "user_input": {
    "app_purpose": "",
    "critical_paths": "",
    "known_limitations": "",
    "external_dependencies": ""
  }
}
```

### File 2: `APPFINISHER_ISSUES.json`

**Purpose**: Exhaustive list of all issues found + status.

**Updated as issues progress**.

```json
{
  "version": "1.0",
  "issues_timestamp": "ISO8601",
  "issues": [
    {
      "id": "ISSUE-001",
      "type": "FAILING_TEST | COVERAGE_GAP | MISSING_FEATURE | CODE_QUALITY | PERF | DOC | FRAUD",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "title": "[short title]",
      "description": "[details]",
      "code_location": "[file:line or test name]",
      "effort": "TRIVIAL | SIMPLE | MODERATE | COMPLEX | ARCHITECTURAL",
      "status": "PENDING | IN_PROGRESS | FIXED | UNFIXABLE",
      "attempts": 0,
      "fix_applied": "[code change made, if any]",
      "reason_unfixable": "[reason if UNFIXABLE]",
      "created_phase": 4,
      "fixed_phase": null,
      "notes": ""
    }
  ],
  "summary": {
    "total": 0,
    "fixed": 0,
    "unfixable": 0,
    "pending": 0,
    "in_progress": 0
  }
}
```

---

### File 3: `APPFINISHER_AUDIT.log`

**Purpose**: Console output log of all Claude Code decisions, commands run, and user interactions.

**Plain text, appended**.

```
[PHASE 0 - 2026-03-23T10:00:00Z]
  Detecting project type...
  Found: Node.js + Jest
  Test file count: 42
  Initial test run: 38/42 pass (90%)
  Coverage: 75%

[PHASE 1 - 2026-03-23T10:05:00Z]
  User question: "What is the primary job this app does?"
  User answer: "Authentication service..."

[PHASE 3 - 2026-03-23T10:15:00Z]
  Running full test suite...
  FRAUD CHECK [F1]: No empty test files. PASS.
  FRAUD CHECK [F2]: Mocking ratio 45%. PASS.
  ...
  Final: 38 passed, 4 failed

[PHASE 4 - 2026-03-23T10:20:00Z]
  Categorizing 4 failures...
  ...
```

---

## 10. Escalation Rules

When to ask the user for a decision:

| Scenario | Action |
|----------|--------|
| **Design Flaw Found** | Ask: "This requires design change [X]. Proceed, redesign, or defer?" |
| **External Dependency Missing** | Ask: "Missing [service]. Install locally, stub, or skip?" |
| **Fix Causes Regressions** | Ask: "Fix caused [N] tests to fail. Revert fix or fix regressions?" |
| **Issue Unfixable After 3 Attempts** | Ask: "Cannot fix after 3 attempts. Accept as unfixable, or try different approach?" |
| **Ambiguous Fraud Pattern** | Ask: "Suspicious pattern found [F_X]. Investigate further or flag?" |
| **Performance Issue** | Ask: "Test [X] runs in [time]. Optimize, skip, or accept?" |
| **Scope Creep** | Ask: "User requested feature [Y] not in manifest. Add to scope or defer?" |

For each escalation:
- **Show evidence** (test output, code, error message)
- **Provide options** (explicit choices, not open-ended)
- **Record decision** in audit log + state

---

## 11. Integration with Other Systems

### Forgetastic Integration (Optional)

AppFinisher is **standalone** by design. However, optionally:
- After Phase [6], save final metrics to Forgetastic RUNTIME_PROOF.jsonl
- Use Forgetastic to validate "build is release-ready" if needed
- Default: No integration (AppFinisher is authoritative)

### CI/CD Integration

AppFinisher should be executable from CI/CD:

```bash
# In GitHub Actions, GitLab CI, or equivalent:
claude code exec appfinisher --auto-proceed=false --phase=0-7
```

Flags:
- `--auto-proceed=false`: Pause at user questions, wait for input
- `--auto-proceed=true`: Use defaults (not recommended for first run)
- `--phase=0-7`: Run phases 0 through 7
- `--phase=5`: Run only Phase 5 (continue fixing)

---

## 12. Success Criteria (Upgraded)

AppFinisher is successful when:

1. ✅ **All tests pass** (100% pass rate)
2. ✅ **Coverage >= 98%** (98% line + branch coverage minimum)
3. ✅ **No fraud patterns** (all F1-F10 checks pass)
4. ✅ **No flaky tests** (tests pass consistently, deterministic 3x rerun pass)
5. ✅ **Zero silent failures** (all issues detected and addressed or documented)
6. ✅ **Unfixable issues explained** (not hidden, rationale recorded)
7. ✅ **User requirements met** (app does what user said it should do)
8. ✅ **Mutation validation passes** (tests actually catch broken code)
9. ✅ **Critical path simulation passes** (real user workflows function end-to-end)
10. ✅ **Enforcement gate is green** (APPFINISHER_ENFORCEMENT.json has no blockers)

**Definition of 100% Completion:**
```
all_tests_pass && coverage >= 98% && fraud_checks = PASS &&
determinism_pass = true && critical_mutation_pass = true &&
critical_path_simulation_pass = true &&
enforcement_gate_green = true &&
user_confirmed_requirements_met
```

---

## 13. Known Limits

AppFinisher **cannot** fix:

- **Infrastructure issues** (app needs AWS S3 but not installed) → Ask user to install
- **Scope changes** (user changes mind about what feature should do) → Mark unfixable, escalate
- **Third-party bugs** (external library has bug) → Workaround or upgrade library
- **Architectural redesigns** (fundamental rethink needed) → Ask user to redesign, revert
- **Physical limitations** (test needs hardware that doesn't exist) → Accept as unfixable
- **Critical paths without practical simulation path** (if a declared critical flow has no practical simulation method, Claude Code must document the limitation and block release if that path is mandatory)

AppFinisher **assumes**:
- Tests are well-written (not trivial, actually test behavior)
- App code is readable and understandable by Claude
- Build/test system is configured correctly
- External dependencies are specified (package.json, requirements.txt, etc.)
- User is available to answer clarification questions

---

## 14. Future Extensions (Out of Scope v1.0)

These are deliberately out of scope for v1.0:

- **Multi-app support** (testing multiple apps in parallel)
- **Cross-app integration testing** (app A calls app B)
- **Load/stress testing** (performance under high load)
- **Security scanning** (SAST, DAST, dependency scanning beyond lint)
- **ML-driven fix suggestions** (learning from past fixes)
- **Automatic refactoring** (large-scale code restructuring)
- **Blockchain/audit trail** (cryptographic proof of fixes, like Forgetastic)
- **Web UI** (dashboard, progress visualization)

---

## Final Instruction to Claude Code

**Do not "improve" AppFinisher in the sense of redesign.**

**Use** it exactly as documented. **Debug** its output. **Verify** it works. **Run** it on your app builds.

**If AppFinisher cannot fix an issue**, that's okay—mark it unfixable with rationale. The goal is honest completion (100% if possible, best-effort with documented reasons if not).

**If AppFinisher can lie** (false test pass, faked coverage, hidden fraud, tests that don't catch bugs, or broken user workflows), **it is not done.**

---

*End of document (Upgraded with Narrow Enhancements).*
