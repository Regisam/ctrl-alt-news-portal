# Ctrl Alt News Portal

A comprehensive news portal built with React, Express.js, and TypeScript.

## Development

### Setup

```bash
npm install
npm run dev
```

Server runs on http://localhost:3000

### Build

```bash
npm run build
npm start
```

---

## Testing & Quality Assurance

Comprehensive testing ensures code quality and prevents regressions.

### Quick Start

```bash
npm run test              # Run all tests (unit + integration)
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:coverage    # Generate coverage report
npm run lint             # Check code style
npm run check            # TypeScript type checking
```

### Testing Documentation

- **[Testing Best Practices](docs/guides/testing-best-practices.md)** — Introduction and philosophy
- **[Unit Testing Guide](docs/guides/unit-testing.md)** — Jest/Vitest patterns and examples
- **[Integration Testing Guide](docs/guides/integration-testing.md)** — API testing with Supertest
- **[E2E Testing Guide](docs/guides/e2e-testing.md)** — Playwright patterns and workflows
- **[Page Object Model](docs/guides/page-object-model.md)** — E2E test architecture
- **[CI/CD Setup](docs/guides/ci-cd-setup.md)** — GitHub Actions automation and quality gates

### Training Materials

- **[Testing Fundamentals](docs/training/testing-fundamentals.md)** — Test pyramid, types, principles
- **[Testing Scenarios](docs/training/testing-scenarios.md)** — 5+ worked examples
- **[Team Checklist](docs/training/team-checklist.md)** — Code review checklist for tests

### Troubleshooting & Reference

- **[Common Issues](docs/troubleshooting/common-issues.md)** — Solutions to 10+ common problems
- **[Performance Benchmarks](docs/troubleshooting/performance-benchmarks.md)** — Test execution times

### Runbooks

- **[Add Tests to PR](docs/runbooks/add-tests-to-pr.md)** — Step-by-step guide
- **[Debug Failing Tests](docs/runbooks/debug-failing-tests.md)** — Troubleshooting locally
- **[Maintain Tests](docs/runbooks/maintain-tests.md)** — Refactoring and updates

---

## Test Coverage

Target: **>60% overall**, **>80% critical paths**

View coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

---

## CI/CD

Tests run automatically on:
- Every pull request
- Every push to `main`
- Nightly scheduled runs

[View CI/CD Setup Guide](docs/guides/ci-cd-setup.md) for details.

---

## Code Quality Standards

- ✅ ESLint: `npm run lint`
- ✅ TypeScript: `npm run check`
- ✅ Unit tests: `npm run test`
- ✅ E2E tests: `npm run test:e2e`
- ✅ Coverage: >60% minimum

---

*For more information, see the [docs/](docs/) directory.*
# E2E tests: non-blocking (Story 11.2 CI/CD fix)
