import type {
  TEffectSessionTriggered,
  TEffectSessionTriggeredJson,
} from '@shared/missions/effects/Effect'
import type { TMissionFileJson } from '@shared/missions/files/MissionFile'
import type { TMissionForceSaveJson } from '@shared/missions/forces/MissionForce'
import { Mission } from '@shared/missions/Mission'
import type { TMissionResourceJson } from '@shared/missions/MissionResource'
import type {
  TMissionPrototypeJson,
  TMissionPrototypeOptions,
} from '@shared/missions/nodes/MissionPrototype'
import type { Target } from '@shared/target-environments/targets/Target'
import { TestEffect } from 'tests/helpers/projects/unit/missions/effects/TestEffect.helpers'
import { TestMissionPrototype } from 'tests/helpers/projects/unit/missions/nodes/TestMissionPrototype.helpers'

/**
 * Minimal test `Mission` that wires up the issue registry via its
 * superclass and holds session-triggered effects, but no forces,
 * resources, or files.
 */
export class TestMission extends Mission {
  public constructor(effectData: TEffectSessionTriggeredJson[] = []) {
    super(
      'mission-1',
      'Mission 1',
      1,
      null,
      null,
      null,
      null,
      null,
      {},
      [],
      [],
      [],
      [],
      effectData,
    )
  }

  protected initializeRoot(): TestMissionPrototype {
    return new TestMissionPrototype(this, { _id: 'ROOT' })
  }

  protected importPrototype(
    data?: Partial<TMissionPrototypeJson>,
    options?: TMissionPrototypeOptions<TestMissionPrototype>,
  ): TestMissionPrototype {
    let prototype = new TestMissionPrototype(this, data, options)
    this.prototypes.push(prototype)
    return prototype
  }

  protected importResources(_data: TMissionResourceJson[]): void {}

  protected importForces(_data: TMissionForceSaveJson[]): void {}

  protected importFiles(_data: TMissionFileJson[]): void {}

  protected importEffects(data: TEffectSessionTriggeredJson[]): void {
    for (let datum of data) {
      this.effects.push(new TestEffect(this, datum))
    }
  }

  public createEffect(
    _target: Target,
    _trigger: TEffectSessionTriggered,
  ): never {
    throw new Error('The test mission builds its effects from JSON only.')
  }
}
