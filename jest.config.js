module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo.*|@expo.*|react-native-reanimated|@react-navigation|@testing-library|date-fns|react-native-paper|@shopify|react-native-url-polyfill|@supabase|@sentry)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/setup/'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!**/node_modules/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
