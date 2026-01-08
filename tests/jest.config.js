/** @type {import("jest").Config} **/
export default {
  verbose: true,
  silent: true,
  projects: [
    {
      displayName: 'e2e',
      roots: ['<rootDir>/projects/e2e/'],
      testEnvironment: 'node',
      maxWorkers: 1,
      setupFilesAfterEnv: ['<rootDir>/initialize.ts'],
      moduleNameMapper: {
        '^@metis/server$': '<rootDir>/../server/MetisServer.ts',
        '^@metis/server/(.+)$': '<rootDir>/../server/$1',
        '^@metis/(.+)$': '<rootDir>/../integration/library/$1',
        '^@shared/(.+)$': '<rootDir>/../shared/$1',
        '^@server/(.+)$': '<rootDir>/../server/$1',
        '^@client/(.+)$': '<rootDir>/../client/src/$1',
        '^@integrations/schema/(.+)$':
          '<rootDir>/../integration/library/schema/$1',
        '^metis/server$': '<rootDir>/../server/MetisServer.ts',
        '^metis/server/(.+)$': '<rootDir>/../server/$1',
        '^metis$': '<rootDir>/../shared/index.ts',
        '^metis/(.+)$': '<rootDir>/../shared/$1',
        '^tests/(.+)$': '<rootDir>/$1',
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
      maxWorkers: 1,
      setupFilesAfterEnv: ['<rootDir>/initialize.ts'],
      moduleNameMapper: {
        '^@metis/server$': '<rootDir>/../server/MetisServer.ts',
        '^@metis/server/(.+)$': '<rootDir>/../server/$1',
        '^@shared/(.+)$': '<rootDir>/../shared/$1',
        '^@server/(.+)$': '<rootDir>/../server/$1',
        '^@client/(.+)$': '<rootDir>/../client/src/$1',
        '^@metis/(.+)$': '<rootDir>/../integration/library/$1',
        '^@integrations/schema/(.+)$':
          '<rootDir>/../integration/library/schema/$1',
        '^metis/server$': '<rootDir>/../server/MetisServer.ts',
        '^metis/server/(.+)$': '<rootDir>/../server/$1',
        '^metis$': '<rootDir>/../shared/index.ts',
        '^metis/(.+)$': '<rootDir>/../shared/$1',
        '^tests/(.+)$': '<rootDir>/$1',
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
