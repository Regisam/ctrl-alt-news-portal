# Runbook: Maintaining & Updating Tests

## When to Update Tests

### After Code Refactoring
```typescript
// OLD: Testing implementation detail
it('should set state', () => {
  component.setState({ count: 1 });
  expect(component.state.count).toBe(1);
});

// NEW: Testing behavior after refactoring
it('should display count of 1', () => {
  render(<Counter />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### After Requirement Changes
1. Update test description to match new behavior
2. Update assertions to match new expected output
3. Add new test if new behavior added
4. Remove test if behavior removed

### After Bug Fixes
1. Add regression test first (test that catches the bug)
2. Fix the bug
3. Verify test passes

---

## Refactoring Tests

### Extract Common Setup
```typescript
// ❌ Duplicate setup
describe('User Service', () => {
  it('should create user', () => {
    const service = new UserService();
    service.connect();
    // test
  });

  it('should delete user', () => {
    const service = new UserService();
    service.connect();
    // test
  });
});

// ✅ Shared setup
describe('User Service', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    service.connect();
  });

  it('should create user', () => { /* test */ });
  it('should delete user', () => { /* test */ });
});
```

### Use Test Factories
```typescript
// ✅ Reusable factory
function createMockUser(overrides = {}) {
  return {
    id: Math.random(),
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  };
}

it('should validate email', () => {
  const user = createMockUser({ email: 'invalid' });
  expect(validateEmail(user)).toBe(false);
});
```

---

## Deprecating Tests

### Remove If:
- Behavior no longer needed
- Feature removed
- Test is permanently flaky

### Mark as Skip During Migration
```typescript
it.skip('should do old behavior', () => {
  // Temporarily disabled during refactor
  // Will remove in next PR
});
```

### Delete When Safe
```bash
git rm client/src/components/__tests__/OldComponent.test.tsx
git commit -m "test: remove tests for deprecated component"
```

---

## Keeping Tests Maintainable

1. **Update test names when behavior changes**
2. **Keep mocks in sync with actual implementations**
3. **Review tests in PR just like code**
4. **Refactor duplicated test code**
5. **Document complex test logic**

---

*For patterns, see unit-testing.md and integration-testing.md*
