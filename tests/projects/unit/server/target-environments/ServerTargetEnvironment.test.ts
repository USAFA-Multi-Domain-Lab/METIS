import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'
import { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import { TargetEnvSandboxing } from '@server/target-environments/TargetEnvSandboxing'
import path from 'node:path'

/**
 * The folder the scan is pointed at. Both tests look the fixture up by its
 * own ID rather than reading the whole registry, so another environment
 * added here later changes neither of them.
 */
const FIXTURE_ROOT = path.join(
  process.cwd(),
  'tests/helpers/projects/unit/target-environments/schema/examples',
)

/**
 * The ID of the environment inside {@link FIXTURE_ROOT}. It matches the
 * folder name, which is both what the scan asks about type errors and what
 * the schema file takes its own ID from.
 */
const FIXTURE_ENVIRONMENT_ID = 'type-check-fixture'

/**
 * The ID of the one target belonging to the fixture environment, which a
 * scan picks up out of the environment's own "targets" folder.
 */
const FIXTURE_TARGET_ID = 'fixture-target'

describe('ServerTargetEnvironment', () => {
  describe('.scan()', () => {
    beforeEach(() => {
      ServerTargetEnvironment.REGISTRY.clear()

      // Loading a schema file registers these first and throws when they
      // are unset. Imports inside the test run resolve through Jest's own
      // mapping, so the registration only has to be valid rather than
      // point anywhere in particular.
      TargetEnvSandboxing.tsconfigPathArgs = {
        baseUrl: FIXTURE_ROOT,
        paths: {},
      }
    })

    afterEach(() => {
      jest.restoreAllMocks()
      ServerTargetEnvironment.REGISTRY.clear()
    })

    test('Skips an environment that has type errors recorded against it', () => {
      // Answered per environment, the way the scan asks it, so that any
      // other environment in the folder is reported on truthfully rather
      // than inheriting this one's errors.
      jest
        .spyOn(TargetEnvSandboxing, 'getTypeErrors')
        .mockImplementation((environmentId) =>
          environmentId === FIXTURE_ENVIRONMENT_ID
            ? `schema.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.`
            : null,
        )

      ServerTargetEnvironment.scan(FIXTURE_ROOT)

      expect(
        ServerTargetEnvironment.REGISTRY.get(FIXTURE_ENVIRONMENT_ID),
      ).toBeUndefined()
    })

    test('Registers an environment that has no type errors recorded against it', () => {
      jest.spyOn(TargetEnvSandboxing, 'getTypeErrors').mockReturnValue(null)

      ServerTargetEnvironment.scan(FIXTURE_ROOT)

      let environment = ServerTargetEnvironment.REGISTRY.get(
        FIXTURE_ENVIRONMENT_ID,
      )

      expect(environment).toBeDefined()
      expect(environment?.targets.map(({ _id }) => _id)).toEqual([
        FIXTURE_TARGET_ID,
      ])
    })
  })
})
