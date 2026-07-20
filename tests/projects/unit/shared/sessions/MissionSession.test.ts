import { describe, expect, test } from '@jest/globals'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { MissionSession } from '@shared/sessions/MissionSession'
import type { TEnvironmentTaskPhase } from '@shared/target-environments/TargetEnvironmentTask'

describe('MissionSession.areEnoughResources', () => {
  test('Allows execution when zeroCost cheat is enabled', () => {
    let session = new TestMissionSession()
    let action: TActionResourceStub = { areEnoughResources: false }

    expect(session.areEnoughResources(action, { zeroCost: true })).toBe(true)
  })

  test('Allows execution when infinite resources are enabled in config', () => {
    let session = new TestMissionSession({ infiniteResources: true })
    let action: TActionResourceStub = { areEnoughResources: false }

    expect(session.areEnoughResources(action)).toBe(true)
  })

  test('Falls back to action resource check when no cheats or infinite resources', () => {
    let session = new TestMissionSession()

    expect(
      session.areEnoughResources({
        areEnoughResources: true,
      } as TActionResourceStub),
    ).toBe(true)
    expect(
      session.areEnoughResources({
        areEnoughResources: false,
      } as TActionResourceStub),
    ).toBe(false)
  })
})

describe('MissionSession.config', () => {
  test('Returns a copy that does not mutate internal config', () => {
    let session = new TestMissionSession()

    let config = session.config
    config.infiniteResources = true

    expect(session.config.infiniteResources).toBe(false)
    expect(session.config).not.toBe(config)
  })
})

describe('MissionSession setup/teardown flags', () => {
  test('setupFailed and teardownFailed reflect script execution failures', () => {
    let session = new TestMissionSession()

    session.setSetupTasks([{ status: 'success' }, { status: 'failure' }])
    session.setTeardownTasks([{ status: 'success' }, { status: 'success' }])

    expect(session.setupFailed).toBe(true)
    expect(session.teardownFailed).toBe(false)
  })
})

/**
 * Test-only MissionSession implementation.
 * @note This class exists only to unit-test MissionSession logic without server dependencies.
 */
class TestMissionSession extends MissionSession<any> {
  public get defaultRealm() {
    throw new Error('Method not implemented.')
  }

  public constructor(options: Partial<TSessionConfig> = {}) {
    super(
      'session-1',
      'Test Session',
      'owner-1',
      'ownerUser',
      'Owner',
      'User',
      new Date('2024-01-01T00:00:00.000Z'),
      options,
      { _id: 'mission-1' },
      [],
      [],
      [],
      [],
    )
  }

  public setSetupTasks(results: TEnvironmentTaskStub[]): void {
    this.addTasks(results, 'setup')
  }

  public setTeardownTasks(results: TEnvironmentTaskStub[]): void {
    this.addTasks(results, 'teardown')
  }

  /**
   * Pushes stub executions onto the master list under the given phase,
   * so the phase-specific getters route them correctly.
   * @note The phase is stamped directly rather than derived from a task
   * source, because deriving it is `TargetEnvironmentTask`'s own job and
   * is covered by that class's tests.
   */
  private addTasks(
    results: TEnvironmentTaskStub[],
    phase: TEnvironmentTaskPhase,
  ): void {
    for (let result of results) {
      this._environmentTasks.push({ ...result, phase } as any)
    }
  }

  // Minimal implementations for abstract members used only for construction.
  protected parseRealmData(): any[] {
    return []
  }

  protected parseMemberData(): any[] {
    return []
  }

  protected parseEnvironmentTaskData(): any[] {
    return []
  }

  protected parseChatChannelData(): any[] {
    return []
  }

  protected mapActions(): void {}

  public toJson(): any {
    return {}
  }

  public toBasicJson(): any {
    return {}
  }
}

/* -- TYPES -- */

/**
 * Minimal task stub used by MissionSession failure helpers.
 */
type TEnvironmentTaskStub = {
  /**
   * Status of the script invocation.
   */
  status: 'success' | 'failure' | 'skipped'
}

/**
 * Minimal action shape needed to unit test MissionSession resource checks.
 */
type TActionResourceStub = {
  /**
   * Whether an action has enough resources to execute.
   */
  areEnoughResources: boolean
}
