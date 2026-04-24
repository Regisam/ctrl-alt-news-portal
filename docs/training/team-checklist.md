# Code Review Checklist — Testing Quality Standards

Use this checklist when reviewing code that includes tests.

## Test Coverage

- ✅ New code has tests
- ✅ Happy path tested (main scenario)
- ✅ Error cases tested (edge cases, failures)
- ✅ Coverage threshold met (60% minimum)
- ✅ Critical paths have 80%+ coverage

## Test Design

- ✅ Tests have clear, descriptive names
- ✅ One behavior per test (not multiple assertions where possible)
- ✅ Arrange-Act-Assert pattern followed
- ✅ Tests verify behavior, not implementation
- ✅ No test interdependencies

## Code Quality

- ✅ No hardcoded timeouts or sleep() calls
- ✅ Proper async/await handling
- ✅ Mock/stub usage is appropriate
- ✅ No console.log or debugging code left
- ✅ Code follows project patterns

## Reliability

- ✅ Tests are deterministic (always pass or always fail)
- ✅ No flaky assertions
- ✅ Database/state properly reset between tests
- ✅ External services mocked (no real API calls)
- ✅ Cleanup happens (afterEach/afterAll)

## Documentation

- ✅ Complex test logic has explanatory comments
- ✅ Test fixtures/factories are clear
- ✅ Edge cases are documented
- ✅ Mocks/stubs are explained if non-obvious

---

*Use this checklist in PR reviews and before marking tests as complete.*
