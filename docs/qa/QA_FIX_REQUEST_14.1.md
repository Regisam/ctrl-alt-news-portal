# QA Fix Request — Story 14.1
**Topic Recommendations Refinement & Serendipity Tuning**

**Verdict**: ❌ FAIL  
**Severity**: CRITICAL (3 blockers)  
**Assigned To**: @dev (Dex)  
**Issue Date**: 2026-05-18  
**Deadline**: Before merge to main

---

## Executive Summary

Story 14.1 is **60% complete**. Core implementation (serendipity tuning, embeddings, cold-start, feedback widget) is solid with comprehensive tests. However, **acceptance criteria AC4-5 and AC9-10 are incomplete** — they were left as mockups/placeholders. Additionally, **CodeRabbit automated review could not run** due to configuration issues.

**Required fixes before PASS verdict:**
1. Integrate real Supabase analytics (AC4-5)
2. Implement A/B analysis + monitoring dashboard (AC9-10)
3. Run CodeRabbit pre-commit security scan

---

## Critical Issues

### 🔴 **Issue 1: AC4-5 — Adoption Rate & Cross-Topic Lift (CRITICAL)**

**Location**: `client/src/lib/topicRecommendationsTuning.ts:130-163`

**Problem**:
```typescript
export function getVariantAnalytics(): Record<SerendipityVariant, VariantAnalytics> {
  // These are placeholder analytics — replace with real data from Supabase
  return {
    control: { adoptionRate: 0.12, ... },        // ❌ Mocked: 12% (target: ≥15%)
    high_serendipity: { adoptionRate: 0.14, ... }, // ❌ Mocked: 14% (target: ≥15%)
    // ...
  };
}
```

**What Was Supposed to Happen** (AC4-5):
- AC4: "Topic adoption rate ≥ 15% (from Analytics in Story 13.7)"
- AC5: "Cross-topic engagement lift ≥ 8% (users read from recommended topics vs. control)"

**What Actually Happened**:
- All analytics are hardcoded placeholder values
- No Supabase queries to fetch real user engagement data
- Function is never called in production code (only in tests)
- No validation that adoption/lift targets are actually met

**Required Fix**:
```typescript
// Instead of mock data, query Supabase:
// 1. Fetch user_recommendations table: user_id, topic_id, variant, created_at
// 2. Fetch user_topic_interactions: user_id, topic_id, engaged_at (bookmark/reaction)
// 3. Compute:
//    - adoptionRate = (topics_with_engagement / total_recommendations) per variant
//    - crossTopicEngagementLift = (articles_from_recommended / total_articles) - control_baseline

export async function getVariantAnalyticsFromSupabase(
  startDate: Date,
  endDate: Date
): Promise<Record<SerendipityVariant, VariantAnalytics>> {
  // Query Supabase for real analytics
  // Validate targets are met or flag as failing metrics
}
```

**Acceptance Criteria**:
- [ ] Real Supabase queries implemented (not mocked)
- [ ] adoption_rate ≥ 15% verified for winning variant
- [ ] cross_topic_engagement_lift ≥ 8% verified
- [ ] Function called from monitoring dashboard (not just tests)
- [ ] Tests updated to mock real Supabase responses

---

### 🔴 **Issue 2: AC9-10 — A/B Analysis & Monitoring Dashboard (CRITICAL)**

**Location**: Missing implementation

**Problem**:
- AC9: "A/B test results analyzed: variants control, tuned_serendipity, tuned_embeddings"
  - ❌ Function `selectWinningVariant()` exists but is never called
  - ❌ No statistical significance testing (confidence intervals, p-values)
  - ❌ No way to compare variants or declare winner
  
- AC10: "Monitoring dashboard updated: daily CTR, adoption rate, cross-topic lift"
  - ❌ No monitoring dashboard exists
  - ❌ ImpactReportPage is generic (not Story 14.1-specific)
  - ❌ No daily metrics aggregation by variant
  - ❌ No segmentation by new vs. returning users

**Required Fix**:

**AC9 — A/B Analysis**:
```typescript
// Create: client/src/lib/topicRecommendationsAnalysis.ts

export interface ABTestResult {
  variant: SerendipityVariant;
  adoptionRate: number;
  ctr: number;
  crossTopicEngagementLift: number;
  sampleSize: number;
  confidenceInterval: { lower: number; upper: number };
  pValue: number;
  isSignificant: boolean; // p < 0.05
}

export async function analyzeABTestResults(
  startDate: Date,
  endDate: Date
): Promise<{
  results: Record<SerendipityVariant, ABTestResult>;
  winningVariant: SerendipityVariant | null;
  recommendation: string;
}> {
  // 1. Query Supabase for variant-specific metrics
  // 2. Compute statistical significance (chi-square or t-test)
  // 3. Return winning variant + recommendation
}
```

**AC10 — Monitoring Dashboard**:
```typescript
// Create: client/src/pages/TopicRecommendationsMonitoringPage.tsx

// Display:
// 1. Daily metrics chart (last 7 days):
//    - CTR per variant
//    - Adoption rate per variant
//    - Cross-topic lift per variant
// 2. Variant comparison table:
//    - Sample size, metrics, confidence intervals
// 3. User segmentation (new vs. returning):
//    - Separate charts for each segment
// 4. Quality checks:
//    - Alert if adoption drops below 10%
//    - Alert if p-value > 0.05 (not significant)
```

**Acceptance Criteria**:
- [ ] `topicRecommendationsAnalysis.ts` created with real Supabase queries
- [ ] Statistical significance testing implemented (p-value, CI)
- [ ] `TopicRecommendationsMonitoringPage.tsx` created
- [ ] Dashboard shows daily metrics (last 7 days)
- [ ] Dashboard shows variant comparison table
- [ ] Dashboard shows new vs. returning segmentation
- [ ] Tests added for analysis logic (A/B test result computation)
- [ ] Route added to App.tsx (e.g., `/monitoring/topic-recommendations`)

---

### 🟡 **Issue 3: CodeRabbit Pre-Commit Review Not Run (HIGH)**

**Location**: System configuration

**Problem**:
- Story 14.1 requires CodeRabbit pre-commit review before QA gate
- CodeRabbit is configured for WSL in CLAUDE.md
- Development is on Darwin (Mac), not Windows
- CodeRabbit binary not found at `~/.local/bin/coderabbit`
- Pre-commit security scan was not executed

**Impact**:
- Code quality issues may be missed (complexity, duplication, security)
- No automated validation of OWASP top 10 patterns
- Manual code review must be more thorough to compensate

**Workaround Options**:
1. **Install CodeRabbit on Mac**: Check if available via homebrew/npm
2. **Run manual code review**: @dev walks through key security patterns
3. **Skip for this story**: Document waiver in QA gate (not recommended)

**Required Action**:
- [ ] @dev attempts `npm install -g coderabbit` or equivalent
- [ ] OR provide detailed manual code review of:
  - `topicRecommendationsTuning.ts` — Hash function security, bucket assignment
  - `topicEmbeddings.ts` — Embedding computation, cache invalidation
  - `TopicRecommendationFeedback.tsx` — XSS vulnerabilities, form validation
- [ ] Document findings in `docs/qa/coderabbit-reports/story-14.1-review.md`

---

## Non-Blocking Concerns

### ⚠️ **Async Test Warning (Task 4)**
**File**: `client/src/__tests__/components/TopicRecommendationFeedback.test.tsx`  
**Issue**: One test shows `act()` warning on auto-hide async operation  
**Severity**: LOW (tests pass, behavior unaffected)  
**Fix**: Wrap setTimeout in `act()` for React state updates  

```typescript
// Before
it('should auto-hide after feedback submission', async () => {
  render(<TopicRecommendationFeedback ... />);
  // ...
  await waitFor(() => expect(...).toBeHidden());
});

// After
it('should auto-hide after feedback submission', async () => {
  render(<TopicRecommendationFeedback ... />);
  // ...
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  });
  expect(...).toBeHidden();
});
```

**Acceptance Criteria**:
- [ ] Test updated to use `act()` for async state transitions
- [ ] Warning eliminated

---

## QA Results Summary

| Check | Status | Details |
|-------|--------|---------|
| Code Review | ⚠️ PARTIAL | CodeRabbit not run; manual review needed |
| Unit Tests | ✅ PASS | 56/56 tests passing |
| Acceptance Criteria | ❌ FAIL | AC4-5, AC9-10 incomplete |
| No Regressions | ✅ PASS | New tests isolated; no impact to other features |
| Performance | ✅ PASS | Batch operations <100ms p99 |
| Security | ⚠️ PENDING | CodeRabbit scan needed |
| Documentation | ✅ PASS | Story file complete, code comments adequate |

**Overall QA Gate**: ❌ **FAIL — Return to @dev for fixes**

---

## Fix Timeline

**Estimated effort**:
- AC4-5 (Real analytics): 2-3h
- AC9-10 (Dashboard): 3-4h
- CodeRabbit review: 0.5-1h (depends on installation success)
- **Total**: 5-8 hours

**Recommended approach**:
1. @dev completes AC4-5 (real Supabase integration)
2. @dev completes AC9-10 (monitoring dashboard)
3. @dev runs CodeRabbit or provides manual security review
4. @dev updates tests for new AC9-10 components
5. @qa re-runs QA gate validation
6. Story marked Done when all criteria met

---

## Contact

**QA Agent**: Quinn (@qa)  
**Issue Created**: 2026-05-18 13:52 UTC  
**Story Link**: `docs/stories/14.1.story.md`

For questions or clarifications, reply in story file Dev Agent Record section.

---

**— Quinn, guardião da qualidade 🛡️**
