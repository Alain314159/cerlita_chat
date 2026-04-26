---
name: cerlita-testing-expert
description: Test-driven development expert for React Native and Jest. Use when writing, fixing, or analyzing tests in the Cerlita Chat project to ensure robust coverage and mocking.
---

# Cerlita Testing Expert

This skill enforces best practices for writing automated tests in Cerlita Chat using Jest and React Native Testing Library.

## Core Principles

1. **Test Location:** All tests must reside in `__tests__/` or adjacent to the component with `.test.tsx` or `.spec.ts` suffix.
2. **Mocking External Dependencies:** Always mock Supabase client (`@supabase/supabase-js`), Expo modules (`expo-notifications`, `expo-secure-store`, `expo-router`), and async storage.
3. **Render Environment:** Use `render` from `@testing-library/react-native`. Wait for async operations using `waitFor`.
4. **Behavior over Implementation:** Test what the user sees and interacts with (e.g., `getByText`, `fireEvent.press`), not the internal component state.

## Standard Mocking Patterns

When testing components that rely on hooks like `useAuth` or `useChat`, mock the hook itself rather than the entire internal store unless testing the store directly.

```typescript
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user', display_name: 'Test' } })
}));
```

## Workflow

1. Identify the component/service to be tested.
2. Determine its external dependencies (network, navigation, native modules).
3. Create necessary mocks.
4. Write test cases covering normal behavior, error states, and edge cases.
5. Run the tests using `npm run test` or `npx jest` to ensure they pass.
