# Tesifye — Feature Scope & Boundaries

> **Purpose:** Defines WHAT each feature does, its inputs, outputs, edge cases, and boundaries. Any agent reads this to understand feature behavior.
> **Related files:** [ARCHITECTURE.md](./ARCHITECTURE.md) (HOW it works) · [SCHEMA.md](./SCHEMA.md) (DATA structures) · [PHASES.md](./PHASES.md) (WHEN to build)

---

## Product Identity

**Name:** Tesifye (tes·if·eye — a play on "testify" + "eye")
**Tagline:** "AI-Native QA for Modern Products"
**Logo:** Minimalist mobile phone frame (line art) + four-pointed star/sparkle at top-right intersection (Electric Violet)

**What Tesifye Is:**
- An AI-powered QA workbench that generates test cases, audits UX, and analyzes requirements from screenshots, descriptions, and documents
- A tool that bridges "what should exist" (PRD/requirements) with "what does exist" (actual UI)
- A context-aware assistant that accumulates project knowledge across multiple generation runs

**What Tesifye Is NOT:**
- Not a test automation runner (doesn't execute tests)
- Not a CI/CD tool (doesn't integrate with build pipelines)
- Not a design tool (doesn't create UI mockups)
- Not a project management tool (doesn't track sprints or assign tasks)

---

## User Roles & Personas

| Role | How They Use Tesifye | Output Expectations |
|---|---|---|
| Manual Tester | Upload screenshots → generate step-by-step test cases | Detailed steps with exact UI element references, plain language |
| Automation Engineer | Upload screenshots → generate structured test data | Gherkin format, IDs, selectors, data-driven parameters |
| QA Lead | Review coverage gaps, UX scores, launch readiness | Summary dashboards, score trends, team-facing reports |
| Product Manager | Verify UI matches requirements, review UX audit | High-level findings, business-impact language |
| UX Designer | Get AI feedback on design decisions | Nielsen heuristics, accessibility findings, flow analysis |

---

## Feature 1: Test Case Generator

**Phase:** 1 (Core Engine)
**Pipeline:** Scout → Generator → Judge

### What It Does
Generates structured test suites from project context (description, scope, audience, role, screenshots).

### Inputs
| Input | Source | Required |
|---|---|---|
| Project description | `projects.description` | Yes |
| Scope | `projects.scope` | Yes |
| Target audience | `projects.target_audience` | Yes |
| Tester role | `projects.user_role` | Yes |
| App type | `projects.app_type` | Yes |
| Screenshots | `project_assets` (via ScreenElementMaps) | No (but recommended) |
| Focus areas | Multi-select UI | No (defaults to all) |
| Previous test suites | Latest `generated_artifacts` of type `test_suite` | Auto-included |

### Focus Area Options
```
☐ Authentication & Login        ☐ Data Validation
☐ Payments & Checkout           ☐ Error Handling
☐ Navigation & Routing          ☐ Performance
☐ User Input / Forms            ☐ Accessibility
☐ Search & Filtering            ☐ Security
☐ Onboarding                    ☐ Edge Cases
```

### Output Structure
Each test case has:
- `tc_id`: Unique ID (TC-001, TC-002, ...)
- `title`: Human-readable title
- `category`: Maps to focus area
- `priority`: Critical / High / Medium / Low
- `preconditions`: What must be true before this test
- `steps`: Array of `{ step_number, action, expected_result }`
- `test_data_suggestion`: Recommended test data
- `ui_elements_referenced`: Array of element labels from ScreenElementMap
- `is_verified`: Boolean — set by Judge

### Edge Cases
| Scenario | Handling |
|---|---|
| No screenshots uploaded | Generate from description only, warn: "Test cases may reference assumed UI elements" |
| 0 focus areas selected | Default to all areas |
| >5 focus areas selected | Warn: "Large suite. Consider 3-5 areas for quality." Split into parallel calls. |
| Duplicate generation (same inputs) | Serve cached artifact, show "Cached result" badge |
| Rate limit during streaming | Save partial output, offer Resume / Keep Partial |
| All providers exhausted | Queue with countdown timer, serve cached if available |

### Post-Processing
- Levenshtein / Jaccard similarity to flag semantically duplicate test cases
- Group by category, sort by priority within groups

### Export Formats (Phase 1: MD/JSON, Phase 2+: CSV/Gherkin/Jira)
```
Markdown (.md)  →  Copy to clipboard
JSON (.json)    →  Download
Gherkin (.feature) → Phase 2 via 8B model formatting
CSV (.csv)      →  Phase 3
Jira / Linear   →  Phase 3 API integration
```

---

## Feature 2: UX/UI Auditor

**Phase:** 2 (Analysis & Richness)
**Pipeline:** Scout → Generator (with `ux_narrative` model) → Judge

### What It Does
Analyzes screenshots against Nielsen's 10 Heuristics + WCAG foundations. Produces a scored report.

### Inputs
| Input | Source | Required |
|---|---|---|
| Screenshots | `project_assets` (up to 10) | At least 1 |
| Navigation flow description | Free text | No |
| App type | `projects.app_type` | Yes |
| Audit focus | Dropdown | No (defaults to full) |

### Audit Focus Options
```
◉ Full Audit (all heuristics)
○ Onboarding & First-Time UX
○ Checkout & Conversion Flow
○ Forms & Input Validation
○ Error Handling & Recovery
○ Information Architecture
○ Mobile Usability
```

### Nielsen's 10 Heuristics Mapping
| # | Heuristic | What Tesifye Checks |
|---|---|---|
| 1 | Visibility of system status | Loading indicators, progress bars, feedback |
| 2 | Match system & real world | Familiar icons, natural language, no jargon |
| 3 | User control & freedom | Back buttons, undo, cancel, clear exits |
| 4 | Consistency & standards | Button styles, nav patterns, platform conventions |
| 5 | Error prevention | Confirmation dialogs, input constraints |
| 6 | Recognition over recall | Visible options, search, breadcrumbs |
| 7 | Flexibility & efficiency | Shortcuts, bulk actions, keyboard support |
| 8 | Aesthetic & minimalist design | Visual hierarchy, whitespace, density |
| 9 | Error recovery | Helpful messages, suggested fixes, retry |
| 10 | Help & documentation | Tooltips, help links, contextual guidance |

### Pre-AI Screen Metrics (Factual, via Canvas)
Before AI analysis, extract deterministic data:
- **Dominant colors** (via `extract-colors`)
- **WCAG contrast ratios** (via `wcag-contrast-utils` on dominant text/bg pairs)
- **Information density** (element count per viewport area from Scout maps)
These metrics are injected into the Generator prompt as facts, not AI opinions.

### Output Structure
- `overall_score`: 0-100 (weighted average of heuristic scores)
- `findings`: Array of `{ heuristic, severity, element, description, suggestion, screenshot_ref }`
- `score_breakdown`: Per-heuristic score (0-10)
- `accessibility_flags`: WCAG issues found
- `strengths`: What the app does well
- `screen_metrics`: Factual data from Canvas analysis

### Edge Cases
| Scenario | Handling |
|---|---|
| Only 1 screenshot | Audit single screen, note: "Limited to single-screen analysis" |
| Screenshots in wrong order | User can reorder via drag-drop |
| Very similar screenshots | pHash detects, prompt: "Similar images detected" |
| No interactive elements found | Flag as potential issue itself |

---

## Feature 3: Bug Report Formatter

**Phase:** 2
**Pipeline:** Generator only (no Scout needed unless screenshots provided)

### What It Does
User describes a bug in plain language → AI formats it into a structured bug report with steps to reproduce, severity classification, and device context.

### Inputs
| Input | Source | Required |
|---|---|---|
| Bug description | Free text | Yes |
| Screenshots | Upload / existing project assets | No |
| Device/browser context | Form fields | No (auto-suggest) |
| Feature area | Dropdown (from project scope) | No |

### Output Structure
- `bug_id`: Auto-generated (BUG-001)
- `title`: One-line summary
- `severity`: Blocker / Critical / Major / Minor / Trivial
- `priority`: P0 / P1 / P2 / P3
- `environment`: OS, browser, screen size (inferred or provided)
- `steps_to_reproduce`: Numbered steps
- `expected_result`: What should happen
- `actual_result`: What actually happens
- `possible_cause`: AI's inference
- `suggested_fix`: AI's suggestion
- `screenshot_refs`: Attached screenshots

---

## Feature 4: Requirement Gap Finder

**Phase:** 3
**Pipeline:** Generator with `long_context` model

### What It Does
User uploads PRD (PDF/DOCX/text) → AI compares against actual UI (ScreenElementMaps) → identifies requirements that exist in the document but NOT in the UI (and vice versa).

### Inputs
| Input | Source | Required |
|---|---|---|
| PRD document | PDF, DOCX, or pasted text | Yes |
| Screenshots | `project_assets` | At least 1 |

### Document Processing Pipeline
```
User uploads file
  ├─ .pdf → pdfjs-dist extracts text layer
  │         └─ No text layer? → tesseract.js (lazy-loaded) → OCR
  ├─ .docx → mammoth extracts text
  └─ .txt → direct use
```

### OCR Strategy (Tesseract.js)
```typescript
// Lazy loaded — only when scanned PDF detected
async function runOCR(pages: Blob[]): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  const results: string[] = [];
  for (const page of pages) {
    const { data: { text } } = await worker.recognize(page);
    results.push(text);
  }
  await worker.terminate();  // Single worker for ALL pages, terminate after
  return results.join('\n\n');
}
```

### Output Structure
- `covered_requirements`: Requirements found in both PRD and UI
- `missing_from_ui`: In PRD but NOT visible in screenshots
- `undocumented_features`: In UI but NOT in PRD
- `ambiguous_requirements`: PRD text too vague to verify

---

## Feature 5: Semantic Link Engine

**Phase:** 3
**Pipeline:** Scout + Generator

### What It Does
Maps PRD sections to specific UI screens, creating a bidirectional traceability matrix.

### Output Structure
- `links`: Array of `{ prd_section, prd_text, screen_label, element_labels, confidence, status }`
- Status: `linked` | `unverified` | `missing_ui` | `missing_prd`

---

## Feature 6: Sidekick Chat

**Phase:** 2 (v1: session-only) → Phase 5 (v2: persistent)

### What It Does
Context-aware chat that knows the project. Can answer: "What test cases don't cover the payment flow?" or "Why did the UX score drop?"

### Context Injection
Chat prompt includes compressed project context (via semantic truncation):
- Latest ScreenElementMaps
- Latest test suite summary
- Latest UX score
- Project description and scope

### v1 vs v2
| Aspect | v1 (Phase 2) | v2 (Phase 5) |
|---|---|---|
| Memory | Session only (cleared on refresh) | DB-persisted, cross-session |
| Context | Current project only | Cross-project comparison |
| Model | reasoning_large | reasoning_large |
| Streaming | Yes | Yes |

---

## Feature 7: Synthetic Test Data Generator

**Phase:** 3
**Pipeline:** Generator with `fast_format` model

### What It Does
Generates realistic test data based on project context using `@faker-js/faker` as the factory + GROQ for intelligent field mapping.

### Output
JSON/CSV of test data, structured per the app's form fields (inferred from ScreenElementMaps).

---

## Feature 8: Persona Friction Analysis

**Phase:** 4
**Pipeline:** Scout → Generator (with audience-specific prompting) → Judge

### What It Does
Analyzes UX from the perspective of different user personas (Gen Z, Boomer, power user, first-time user, accessibility needs).

### Input: Persona Selection
```
☐ Gen Z (mobile-first, impatient, gesture-dependent)
☐ Tech-averse (needs explicit guidance, no jargon)
☐ Power User (wants shortcuts, bulk actions, dense UI)
☐ First-time User (needs onboarding, progressive disclosure)
☐ Accessibility (screen reader, motor impaired, low vision)
```

### Output: Per-persona friction report with specific UX issues and severity.

---

## Feature 9: i18n / RTL Audit

**Phase:** 4
**Pipeline:** Scout → Generator → Judge

### What It Does
Checks UI for internationalization readiness: truncated text risks, RTL layout issues, hardcoded strings, date/number format assumptions.

---

## Feature 10: Launch Readiness Score

**Phase:** 4
**Pipeline:** Meta-analysis across all existing artifacts

### What It Does
Composite score combining: test coverage %, UX audit score, requirement gap count, open bugs.

### Output
```
Overall: 72/100 — ⚠️ Not Ready for Launch
  ├─ Test Coverage:     85% ✅
  ├─ UX Score:          68% ⚠️
  ├─ Requirement Gaps:   3  ⚠️
  └─ Open Bugs:          2  (1 Critical)

╰→ Blocking Issues:
   • Critical bug: Payment timeout not handled (BUG-003)
   • UX: No loading indicator on checkout (Heuristic 1)
   • Missing: "Forgot Password" flow (from PRD section 4.2)
```

---

## Cross-Feature: Export System

### Format Support by Phase

| Format | Phase | Features | Method |
|---|---|---|---|
| Markdown | 1 | All | Direct template rendering |
| JSON | 1 | All | Raw Zod output |
| Copy to Clipboard | 1 | All | `navigator.clipboard` |
| Gherkin (.feature) | 2 | Test Cases | GROQ 8B reformatting |
| CSV | 3 | Test Cases, UX Issues | `json2csv` library |
| Jira | 3 | Test Cases, Bugs | API integration |
| Linear | 3 | Test Cases, Bugs | API integration |

---

## Cross-Feature: Role-Based Output

The user's selected role modifies:
- **Language complexity** (PM gets business language, tester gets technical)
- **Detail level** (manual tester gets more steps, lead gets summaries)
- **Export defaults** (automation engineer defaults to Gherkin)
- **Priority weighting** (QA lead sees Critical/Blocker prominence in UX scores)

---

## Cross-Feature: Dirty State

When project context changes after assets were already analyzed:
1. `is_dirty = true` on all `project_assets` for that project
2. UI: Subtle pulsing violet glow on dirty screens
3. Prompt: "These screenshots were analyzed before your latest scope changes. Re-analyze?"
4. User can: Re-analyze (re-run Scout) or Dismiss

---

## Cross-Feature: Data Privacy Controls

| Mode | Providers Used | Data Training | Default |
|---|---|---|---|
| Private | GROQ only | No training | ✅ Default |
| Extended | GROQ + Google AI + Cerebras | Google may train on free-tier | Opt-in per project |

User toggle in project settings. Shown with clear disclosure:
> "Extended mode enables Google AI as a fallback provider. Google's free tier may use your data for model training. Enable only if you're comfortable with this."
