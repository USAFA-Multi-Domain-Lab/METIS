import type { Effect } from '@shared/missions/effects/Effect'
import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'
import { TargetArgument } from '@shared/target-environments/arguments/TargetArgument'
import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'

/**
 * Minimal test `TargetArgument` that hydrates from JSON the same way the
 * server/client implementations do.
 */
export class TestTargetArgument extends TargetArgument {
  public toTargetEnvContext(): TAnyObject {
    return {}
  }

  public static fromJson(
    json: TTargetArgumentJson,
    effect: Effect,
  ): TestTargetArgument {
    let parameter = effect.target?.getParameterById(json.parameterId)

    if (json.type === 'unknown' && parameter) {
      json = { ...json, type: parameter.type } as TTargetArgumentJson
    }

    TestTargetArgument.applyDefault(json, parameter)

    let context = TestTargetArgument.buildContext(json, effect.normalize())
    return new TestTargetArgument(
      effect.normalize(),
      json._id,
      json.parameterId,
      context,
    )
  }
}
