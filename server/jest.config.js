require('ts-node').register({
  transpileOnly: true,
  project: './tsconfig.json',
})

module.exports = {
  // Shared configuration for all projects
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^metis/server$': '<rootDir>/index.ts',
    '^metis/server/(.*)$': '<rootDir>/$1',
    '^metis/(.*)$': '<rootDir>/../shared/$1',
    '^integration/library/(.*)$': '<rootDir>/../integration/library/$1',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  coverageDirectory: 'coverage',
  projects: [
    {
      displayName: 'integration',
      roots: ['<rootDir>/tests/integration/'],
      globalSetup: '<rootDir>/tests/integration/setupLoader.js',
    },
    {
      displayName: 'unit',
      roots: ['<rootDir>/tests/unit'],
    },
  ],
}
