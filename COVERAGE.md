# Test Coverage Baseline

Coverage metrics for Ctrl Alt News portal.

**Baseline Date**: 2026-04-24  
**Framework**: Vitest + Jest

## Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Overall Lines | >60% | - |
| Critical Library Code | >80% | - |
| Overall Branches | >40% | - |
| Overall Functions | >40% | - |
| Overall Statements | >40% | - |

## Coverage by Directory

### Client-Side (React)

| Directory | Target | Status |
|-----------|--------|--------|
| `client/src/pages/` | >50% | Pending |
| `client/src/components/` | >60% | Pending |
| `client/src/hooks/` | >80% | Pending |
| `client/src/lib/` | >80% | Pending |

### Server-Side (Node.js)

| Directory | Target | Status |
|-----------|--------|--------|
| `server/middleware/` | >60% | Pending |
| `server/lib/` | >80% | Pending |
| `server/routes/` | >50% | Pending |

## Running Coverage

```bash
npm run test:coverage
```

Coverage report will be generated in `./coverage/` directory.

## Coverage Strategy

### Phase 1 (Sprint 10)
- Setup testing infrastructure ✓
- Create test utilities ✓
- Write example tests ✓
- Establish baseline metrics (pending)

### Phase 2 (Sprint 11)
- Integration tests (Story 9.2)
- Component tests (Story 9.3)
- E2E tests (Story 9.4)
- Target: >60% overall coverage

### Phase 3+
- Increase critical code coverage to >80%
- Add performance and regression tests
- Implement CI/CD coverage enforcement

## Maintenance

Coverage reports are updated after each `npm run test:coverage` run.

For tracking progress over time, maintain a git history of this file.

## Notes

- Initial baseline will be measured after Story 9.1 completion
- Coverage goals are aspirational; focus on critical paths first
- Coverage percentage is less important than critical code quality
