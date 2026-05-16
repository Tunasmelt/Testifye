# Feature 10: Launch Readiness Score
Phase: 4 | Pipeline: Meta-analysis (no AI call — reads existing artifacts)

## What it does
Composite score synthesizing all other artifact types into a go/no-go launch assessment. Reads the latest test suite, UX audit, gap analysis, and bug reports from `manifest_snapshot` — **does NOT call the AI to compute this**.

## Key files
- `src/lib/services/launch-readiness.service.ts` — pure computation, reads manifest_snapshot
- `src/components/features/LaunchReadinessPage.tsx`
- `src/components/generation/LaunchReadinessReport.tsx` — the visual score card

## Computation (deterministic, no AI call)
```typescript
function computeLaunchScore(snapshot: ManifestSnapshot): LaunchReadinessOutput {
  const testCoverage = snapshot.test_suite ? computeCoverage(snapshot.test_suite) : 0;
  const uxScore = snapshot.ux_review?.overall_score ?? 0;
  const gapCount = snapshot.gap_analysis?.findings.filter(g => 
    g.type === 'missing_from_ui' && g.severity === 'critical'
  ).length ?? 0;
  const criticalBugs = snapshot.bug_reports?.filter(b => 
    b.severity === 'blocker' || b.severity === 'critical'
  ).length ?? 0;

  // Weighted composite
  const score = Math.round(
    (testCoverage * 0.35) + (uxScore * 0.30) + 
    (Math.max(0, 100 - gapCount * 15) * 0.20) + 
    (Math.max(0, 100 - criticalBugs * 25) * 0.15)
  );

  return { score, testCoverage, uxScore, gapCount, criticalBugs, blockingIssues };
}
```

## Output fields (from SCHEMA.md LaunchReadinessSchema)
```
overall_score:    0–100
status:           ready | caution | not_ready  (≥80 = ready, 60–79 = caution, <60 = not_ready)
test_coverage:    0–100 (% of focus areas with ≥1 test case)
ux_score:         0–100 (from UX audit)
gap_count:        number (critical missing_from_ui gaps)
open_bugs:        number (blocker + critical bugs)
blocking_issues:  string[]  (human-readable list of what's preventing launch)
component_scores: { test_coverage, ux, requirements, bugs } with status per component
```

## Visual output
```
Overall: 72/100 — ⚠️ Caution — Not Recommended for Launch
  ├─ Test Coverage:     85% ✅
  ├─ UX Score:          68% ⚠️
  ├─ Requirement Gaps:   3  ⚠️
  └─ Open Bugs:          2  (1 Critical) ❌

╰→ Blocking Issues:
   • Critical bug: Payment timeout not handled (BUG-003)
   • UX: No loading indicator on checkout (H1)
   • Missing: "Forgot Password" flow (PRD section 4.2)
```

## Gotchas
- This feature reads `manifest_snapshot` directly — it is the **only** feature allowed to do this (read cache reads are fine here since we're computing a meta-score, not writing)
- If any artifact type is missing, that dimension scores 0 with a warning badge
- `blocking_issues` are human-readable strings — not artifact IDs
- No AI call = instant render (no skeleton, no streaming)

## Do not
- Call any AI model from this feature — it's a pure computation
- Show this feature before at least 2 other artifact types have been generated
