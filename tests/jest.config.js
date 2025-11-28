/** @type {import("jest").Config} **/
export default {
  globalSetup: '<rootDir>/lifecycle.cjs',
  globalTeardown: '<rootDir>/lifecycle.cjs',
  projects: [
    {
      displayName: 'e2e',
      roots: ['<rootDir>/projects/e2e/'],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^metis/server$': '<rootDir>/../server/index.ts',
        '^metis/server/(.+)$': '<rootDir>/../server/$1',
        '^metis$': '<rootDir>/../shared/index.ts',
        '^metis/(.+)$': '<rootDir>/../shared/$1',
      },
      transform: {
        '^.+\\.[tj]sx?$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/projects/e2e/tsconfig.json',
          },
        ],
      },
    },
    {
      displayName: 'integration:api',
      roots: ['<rootDir>/projects/integration/api'],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^metis/server$': '<rootDir>/../server/index.ts',
        '^metis/server/(.+)$': '<rootDir>/../server/$1',
        '^metis$': '<rootDir>/../shared/index.ts',
        '^metis/(.+)$': '<rootDir>/../shared/$1',
      },
      transform: {
        '^.+\\.[tj]sx?$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/projects/integration/api/tsconfig.json',
          },
        ],
      },
    },
  ],
}
