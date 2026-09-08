import type { TEffectSessionTriggered } from '@shared/missions/effects/Effect'
import { Effect } from '@shared/missions/effects/Effect'
import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'
import type { Target } from '@shared/target-environments/targets/Target'
import { JsonSerializableArray } from '@shared/toolbox/arrays/JsonSerializableArray'
import type { TestMission } from 'tests/helpers/projects/unit/missions/TestMission.helpers'
import { TestTargetArgument } from 'tests/helpers/projects/unit/target-environments/arguments/TestTargetArgument.helpers'
import { TestTargetEnvironment } from 'tests/helpers/projects/unit/target-environments/TestTargetEnvironment.helpers'

/**
 * Minimal test `Effect` that is hosted directly by the mission and
 * hydrates its arguments via {@link TestTargetArgument}.
 */
export class TestEffect extends Effect<
  TMetisBaseComponents,
  'sessionTriggeredEffect'
> {
  public constructor(mission: TestMission, data: TTestEffectData) {
    super(
      data._id,
      data.name,
      data.targetId,
      data.environmentId,
      data.targetEnvironmentVersion,
      data.order ?? 0,
      data.description ?? 'Test effect description',
      {
        type: 'sessionTriggeredEffect',
        trigger: data.trigger ?? 'session-start',
        sourceAction: null,
        sourceNode: null,
        sourceForce: null,
        sourceMission: mission,
        host: mission,
      },
      data.arguments,
      data.localKey ?? 'local-key-1',
    )
  }

  protected determineTarget(
    targetId: string,
    environmentId: string,
  ): Target | null {
    if (environmentId === Effect.LEGACY_INFER_ENV_ID) {
      return TestTargetEnvironment.registry.inferTarget(targetId) ?? null
    }

    let environment = TestTargetEnvironment.registry.get(environmentId)
    if (!environment) return null

    return environment.getTarget(targetId) ?? null
  }

  protected parseArguments(
    data: TTargetArgumentJson[],
  ): JsonSerializableArray<TestTargetArgument> {
    return JsonSerializableArray.fromJson(data, (datum: TTargetArgumentJson) =>
      TestTargetArgument.fromJson(datum, this),
    )
  }
}

/* -- TYPES -- */

/**
 * The data a {@link TestEffect} is built from. Only the fields a test
 * needs to state are required; the rest carry test defaults.
 */
export type TTestEffectData = {
  _id: Effect['_id']
  name: Effect['name']
  targetId: Effect['targetId']
  environmentId: Effect['environmentId']
  targetEnvironmentVersion: Effect['targetEnvironmentVersion']
  arguments: TTargetArgumentJson[]
  trigger?: TEffectSessionTriggered
  order?: Effect['order']
  description?: Effect['description']
  localKey?: Effect['localKey']
}
