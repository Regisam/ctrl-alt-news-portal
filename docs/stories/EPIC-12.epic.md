# EPIC-12: Advanced Platform Features — ML-Enhanced Recommendations & Discovery

**Epic ID**: EPIC-12  
**Sprint**: 16-18 (Advanced ML & Platform Expansion)  
**Status**: Draft  
**Date Created**: 2026-05-04  
**Owner**: @pm (Morgan)  
**Epic Type**: Platform Features & Machine Learning Integration

---

## Vision

Transform the Ctrl Alt News portal from engagement-focused to intelligence-driven by leveraging behavioral data from EPIC-11. Implement a **Hybrid Approach** (Rule-Based + Light ML) that delivers immediate value while establishing ML foundations for future growth. Enable readers to discover highly relevant content through intelligent recommendations, personalized feeds, and topic-based discovery—balancing engineering simplicity with user value.

**Strategic Context:**
- EPIC-11 provided engagement data (scroll depth, reading time, reactions, bookmarks)
- EPIC-12 uses this data to power intelligent content discovery
- Bridges from rule-based recommendations (MVP) → ML-enhanced (scale)

**Business Value**:
- 📈 **Click-through rate**: +30-40% on recommendations (vs. random)
- 🔄 **Return visitor rate**: +20% (intelligent discovery keeps users coming back)
- ⏱️ **Session duration**: +15% (users find more relevant content faster)
- 🎯 **Engagement quality**: Deeper engagement with matched interests
- 🧠 **ML foundation**: Establish infrastructure for future advanced ML features
- 📊 **Data insights**: Understand user content affinities by topic/author/recency

---

## Strategic Roadmap

### Phase 1: Rules Engine (Sprints 16-17, 3 weeks)

**Goal**: Deploy intelligent recommendations without ML complexity  
**Approach**: If/Then rules based on user behavior from EPIC-11

**Stories 12.1-12.3**: Rule-Based Discovery System
- 12.1: Topic-Based Rules Engine (IF user reads AI → recommend AI articles)
- 12.2: Author-Based Rules (IF user bookmarks Alex Chen → recommend more from Alex)
- 12.3: Recency + Engagement Fusion (combine trending + user interest)

**Deliverables:**
- Rules configuration system (YAML-based for easy updates)
- Recommendation engine that fires rules in priority order
- Dashboard to track rule performance (CTR, engagement by rule)
- A/B test harness from EPIC-11 to validate rules

**Expected Outcome:**
- Recommendations +20-30% better than baseline
- Fast iteration on rule tuning
- Clear data on which rules work for tech audience

---

### Phase 2: Light ML (Sprint 18, 2-3 weeks)

**Goal**: Add ML-enhanced recommendations without full data science infrastructure  
**Approach**: Simple ML models (clustering, similarity) on top of rules engine

**Stories 12.4-12.5**: ML Foundation Layer
- 12.4: Article Clustering (group articles by latent topic using TF-IDF + K-means)
- 12.5: Content Similarity Scoring (cosine similarity for "users who read X also like Y")

**Deliverables:**
- Topic clustering model (offline, runs nightly)
- Similarity scoring integrated into recommendation rules
- ML explainability (show WHY article was recommended)
- Performance monitoring (model drift, staleness)

**Expected Outcome:**
- Recommendations +35-45% better than baseline
- Foundation to add more sophisticated models (e.g., collaborative filtering in EPIC-13)
- No data science team required yet (rules + simple ML)

---

### Phase 3: Advanced Features (Sprint 18-19, 2 weeks)

**Goal**: New user-facing features enabled by recommendation intelligence  
**Stories 12.6-12.8**: Discovery & Engagement Expansion
- 12.6: Topic Pages (curated collections by technology domain: AI, Security, Web3, etc.)
- 12.7: "Smart Digest" (personalized email/notification of top articles for user's interests)
- 12.8: Discovery Widget (sidebar showing "Trending in Your Interests")

**Deliverables:**
- Topic landing pages with rule + ML recommendations
- Smart digest engine (daily/weekly email with top matches)
- Recommendation widget in home, article detail, sidebars
- Notification system (opt-in) for breaking news in user's interests

**Expected Outcome:**
- New engagement vectors (email, topics, notifications)
- Platform feels "intelligent" and personalized
- Ready for EPIC-13 (advanced ML: collaborative filtering, neural networks)

---

## Scope Definition

### IN Scope (MVP)

**Rules Engine**:
- Topic-based recommendation rules (Tech categories: AI, Security, Web3, etc.)
- Author-based rules (follow favorite writers)
- Recency weighting (newer articles preferred but not exclusively)
- Engagement weighting (trending articles + user interest intersection)
- Rule priority system (orderable, testable)
- YAML configuration (non-code rule updates)

**Light ML**:
- Article clustering by topic (TF-IDF + K-means, runs offline)
- Content similarity scoring (cosine similarity for "related articles")
- Simple explainability (show which rule/ML model fired)
- Performance dashboard (CTR by rule, model staleness)

**Advanced Features**:
- Topic pages (curated collections, filtered recommendations)
- Smart Digest (daily email with top 3-5 matches)
- Discovery Widget (sidebar recommendations by interest)
- Notification system (opt-in for trending in user's topics)

**Data Foundation**:
- Use EPIC-11 behavioral data (scroll depth indicates interest)
- Track recommendation impressions & clicks (for A/B testing)
- Collect feedback (thumbs up/down on recommendations)

### OUT of Scope

- Real-time machine learning (batch processing only)
- Complex ML models (neural networks, deep learning)
- Collaborative filtering (predict user-user similarity)
- Natural language processing (NLP) for content understanding
- Sentiment analysis or content tone classification
- Video/image-based recommendations
- Social recommendations (friend activity)
- Paid content or premium features
- Real-time notifications (email/push only)
- User authentication system (use localStorage from EPIC-11)

---

## Success Metrics

| Metric | Target | Validation Method | Owner |
|--------|--------|------------------|-------|
| **Recommendation CTR** | +35% vs. random | GA4 event tracking (click_recommendation) | @qa |
| **Rules engine coverage** | 100% of recommendations | Rules firing logs | @dev |
| **ML model performance** | 80%+ accuracy (user prefers recommendation) | A/B test feedback | @qa |
| **Topic page traffic** | 2000+ sessions/week | GA4 page views | @qa |
| **Smart Digest adoption** | 30%+ users opt-in | Email analytics | @po |
| **Discovery widget engagement** | 15% CTR | Recommendation widget impressions | @qa |
| **Rule iteration speed** | 1 new rule per sprint | YAML commits | @dev |
| **Model staleness** | <24h | Clustering refresh logs | @dev |
| **No performance regression** | Page load <100ms overhead | Lighthouse CI | @qa |

---

## Stories (Planned)

### Phase 1: Rules Engine (Stories 12.1–12.3)

#### Story 12.1: Topic-Based Rules Engine
- **Effort**: M (12h)
- **Goal**: Enable recommendations based on user's topic interests
- **Deliverables**:
  - `rules-engine.ts` library (IF/THEN evaluation, priority ordering)
  - YAML rule format (`rules.config.yaml`)
  - Topic extraction from articles (use EPIC-11 tags)
  - Recommendation rules: "IF user reads AI → boost AI articles"
  - Rule performance dashboard (CTR by rule)
  - Tests: rule evaluation, edge cases

#### Story 12.2: Author-Based Rules
- **Effort**: S (8h)
- **Goal**: Enable users to follow favorite writers
- **Deliverables**:
  - `useAuthorFollow` hook (add/remove authors from follow list)
  - Author recommendation rules (IF bookmarked author → more from author)
  - Author pages with follower count
  - Tests: follow state, rule firing

#### Story 12.3: Recency + Engagement Fusion
- **Effort**: M (10h)
- **Goal**: Combine trending signals with user interests
- **Deliverables**:
  - Engagement score formula (reactions + bookmarks + shares)
  - Recency weighting (newer >7d weighted differently than older)
  - Rule: "IF trending in user's favorite topic → rank high"
  - Dashboard: trending by topic, trending for user
  - Tests: score calculation, ranking accuracy

### Phase 2: Light ML (Stories 12.4–12.5)

#### Story 12.4: Article Clustering
- **Effort**: M (14h)
- **Goal**: Group articles by latent topic for better similarity matching
- **Deliverables**:
  - `article-clustering.ts` library (TF-IDF + K-means)
  - Nightly batch clustering job (all articles → K clusters)
  - Cluster assignment per article (stored in article metadata)
  - Cluster naming (auto-detect topic from articles in cluster)
  - Cluster visualization dashboard
  - Tests: cluster quality, stability across runs

#### Story 12.5: Content Similarity Scoring
- **Effort**: M (12h)
- **Goal**: Enable "users who read X also like Y" recommendations
- **Deliverables**:
  - `content-similarity.ts` library (cosine similarity scoring)
  - Similarity matrix computation (offline)
  - ML recommendation rule (IF article similar to read article → recommend)
  - Explainability (show "similar because: both about quantum computing")
  - Performance tuning (caching, efficient similarity lookup)
  - Tests: similarity accuracy, edge cases

### Phase 3: Advanced Features (Stories 12.6–12.8)

#### Story 12.6: Topic Pages
- **Effort**: M (12h)
- **Goal**: Curated landing pages for technology domains
- **Deliverables**:
  - `TopicPage` component (`/topics/{topic-slug}`)
  - Topic metadata (description, related topics, color scheme)
  - Content filtering by topic (use article tags + clusters)
  - Recommendations: trending in topic + user's interests
  - Topic feed (latest articles in topic)
  - Tests: page rendering, content filtering

#### Story 12.7: Smart Digest (Email)
- **Effort**: L (16h)
- **Goal**: Daily/weekly email of personalized top articles
- **Deliverables**:
  - `useSmartDigest` hook (generate digest for user)
  - Digest schedule configuration (daily/weekly, time)
  - Email template (top 3-5 articles ranked by relevance)
  - Unsubscribe link & preference management
  - Analytics: open rate, click rate, unsubscribe rate
  - Tests: digest generation, ranking quality, email delivery

#### Story 12.8: Discovery Widget
- **Effort**: M (10h)
- **Goal**: Sidebar widget showing trending content in user's interests
- **Deliverables**:
  - `DiscoveryWidget` component (reusable, embeddable)
  - Trending articles filtered by user's favorite topics
  - Widget in home, article detail, sidebars
  - Recommendation reasons shown (why this article?)
  - Widget performance (lazy-load, caching)
  - Tests: widget rendering, recommendation freshness

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **Rules are too simplistic** | LOW | MEDIUM | Start with rules, validate with A/B test, move to ML if needed |
| **ML models overfit user base** | MEDIUM | MEDIUM | Holdout validation set, monitor performance over time, retrain regularly |
| **Clustering quality poor** | MEDIUM | MEDIUM | Evaluate cluster silhouette score, visualize clusters, manual review |
| **Performance regression** | MEDIUM | LOW | Benchmark page load before/after, cache recommendations, lazy-load |
| **Rules conflict** | LOW | LOW | Priority-based rule system, clear rule ordering documentation |
| **Email deliverability** | MEDIUM | LOW | Use established email service (SendGrid, AWS SES), monitor bounce rates |
| **User privacy concerns** | MEDIUM | MEDIUM | Only use on-device data (localStorage), transparent about tracking, opt-out option |

---

## Dependencies

- **Blocked by**: EPIC-11 (Behavioral Analytics & User Data) ✅ Complete
- **Unblocks**: EPIC-13 (Advanced ML: Collaborative Filtering, Neural Networks) — foundation established
- **Related**: 
  - EPIC-10 (Growth & Discovery) — discovery features build on SEO/social
  - A/B testing from EPIC-11.8 — validate rule/ML performance
  - GA4 events from EPIC-11.7 — track recommendation metrics

---

## Quality Gates (CodeRabbit Integration)

**Pre-Implementation**:
- [ ] Define recommendation quality metrics (CTR, NDCG, user feedback)
- [ ] Create testing strategy for ML models (holdout validation, cluster analysis)
- [ ] Establish performance baselines (current recommendations performance)
- [ ] Plan A/B testing framework (compare rules vs. baseline vs. ML)

**Per Story**:
- [ ] All tests passing (unit + integration)
- [ ] No TypeScript errors
- [ ] ESLint passing
- [ ] CodeRabbit: 0 CRITICAL, <5 HIGH issues
- [ ] Recommendation quality validated (A/B test passing or manual review)
- [ ] Performance: <20ms per recommendation (rules + ML combined)
- [ ] Email deliverability tested (if email stories)

**Post-Implementation**:
- [ ] Rules library performance benchmarked
- [ ] ML models evaluated on holdout set
- [ ] A/B test results analyzed
- [ ] Recommendation dashboard live & monitoring
- [ ] Ready for EPIC-13 (advanced ML foundation in place)

---

## 🤖 CodeRabbit Integration

**Story Type:** Platform Features + ML Foundation  
**Complexity:** STANDARD (rules engine) → ADVANCED (ML models)  
**Specialized Agents:** 
- @dev (primary) — rules engine, recommendation logic
- @data-engineer (if available) — ML clustering, similarity
- @qa — performance, A/B testing validation

**Quality Focus:**
- Rules engine correctness (IF/THEN evaluation)
- ML model quality (clustering, similarity accuracy)
- Performance impact (keep recommendations <20ms)
- A/B test statistical validity
- Email deliverability & security

**Self-Healing Config:**
- Mode: light (CRITICAL/HIGH auto-fix)
- Expected: No CRITICAL issues in rules/ML logic

---

## Completion Criteria

✅ **Ready for Development when:**
- [ ] EPIC-12 structure validated by PM & team
- [ ] Stories refined by @sm (acceptance criteria, dependencies)
- [ ] A/B testing strategy aligned with @qa
- [ ] Estimated effort resonates with team capacity
- [ ] Blockers identified and mitigated

**Success Looks Like:**
- Rules engine delivers +30% improvement in recommendation CTR
- ML models established (clustering, similarity) with 80%+ accuracy
- Topic pages and smart digest adopted by 30%+ of users
- Foundation ready for EPIC-13 (collaborative filtering, neural networks)
- Zero recommendation-related performance regressions

---

## Change Log

| Date | Agent | Action | Notes |
|------|-------|--------|-------|
| 2026-05-04 | @pm (Morgan) | Epic Planned | EPIC-12 hybrid approach: rules engine (phase 1) + light ML (phase 2) + features (phase 3). Ready for @sm story creation. |

---

## Dev Notes (For @dev during implementation)

**Tech Stack:**
- Rules engine: TypeScript with simple IF/THEN evaluator
- Clustering: TF-IDF (tokenization, inverse document frequency) + K-means (from ml.js library)
- Similarity: Cosine similarity (vector math)
- Email: SendGrid or AWS SES API
- Storage: Use EPIC-11 localStorage + GA4 events for tracking

**Architecture:**
```
RecommendationEngine
  ├── RulesEngine (IF/THEN firing)
  │   ├── Topic-based rules
  │   ├── Author-based rules
  │   ├── Recency+Engagement rules
  │   └── Rule priority/ordering
  │
  ├── MLEngine (Light Models)
  │   ├── ArticleClustering (nightly batch)
  │   ├── ContentSimilarity (cosine scoring)
  │   └── ModelMonitoring (drift detection)
  │
  └── RecommendationPipeline
      ├── Apply rules (get candidates)
      ├── Score with ML (if applicable)
      ├── Rank by score
      └── Personalize (user's A/B variant)
```

**Performance Targets:**
- Recommendation evaluation: <20ms (rules <5ms, ML <15ms)
- Clustering job: runs nightly, completes in <5min (all articles)
- Email generation: <2s per digest
- Caching: aggressive (invalidate on new articles hourly)

---

*Last Updated: 2026-05-04*  
*Status: Draft*  
*Next: @sm creates stories 12.1-12.3 from this epic*
