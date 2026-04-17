import { Mission, type TMissionSaveJson } from '@shared/missions/Mission'
import {
  MissionAction,
  type TMissionActionJson,
} from '@shared/missions/actions/MissionAction'
import type {
  TEffectExecutionTriggeredJson,
  TEffectSessionTriggeredJson,
} from '@shared/missions/effects/Effect'
import type { TMissionForceJson } from '@shared/missions/forces/MissionForce'
import type { TMissionNodeJson } from '@shared/missions/nodes/MissionNode'
import { MissionNode } from '@shared/missions/nodes/MissionNode'
import { Types } from 'mongoose'
import { TestToolbox } from 'tests/helpers/TestToolbox'

const {
  opened: _opened,
  blocked: _blocked,
  executions: _executions,
  alerts: _alerts,
  ...SAVE_NODE_DEFAULT_PROPERTIES
} = MissionNode.DEFAULT_PROPERTIES

export const FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES = {
  get ORDER() {
    return 0
  },
  get BLUE_FORCE_INITIAL_BALANCE() {
    return 120
  },
  get RED_FORCE_INITIAL_BALANCE() {
    return 90
  },
}
export const INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES = {
  get ORDER() {
    return 1
  },
  get BLUE_FORCE_INITIAL_BALANCE() {
    return 60
  },
  get RED_FORCE_INITIAL_BALANCE() {
    return 30
  },
}

/**
 * Creates a mission payload used by the mission REST tests.
 * @param name The mission name.
 * @returns The mission create payload.
 */
export function createMissionPayload(
  name: string = `test_missions_created_${TestToolbox.generateRandomId()}`,
): TMissionCreatePayload {
  let fixtureIds: TMissionFixtureIds = {
    fuelResourceId: TestToolbox.generateRandomId(),
    intelResourceId: TestToolbox.generateRandomId(),
    rootPrototypeId: TestToolbox.generateRandomId(),
    objectivePrototypeId: TestToolbox.generateRandomId(),
    rootStructureKey: TestToolbox.generateRandomId(),
    objectiveStructureKey: TestToolbox.generateRandomId(),
    missionFileId: TestToolbox.generateRandomId(),
    fileReferenceId: new Types.ObjectId().toHexString(),
  }

  return {
    name,
    versionNumber: 1,
    resources: [
      {
        _id: fixtureIds.fuelResourceId,
        name: 'Fuel',
        icon: 'resources/drops',
        order: FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES.ORDER,
      },
      {
        _id: fixtureIds.intelResourceId,
        name: 'Intel',
        icon: 'resources/microchip',
        order: INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES.ORDER,
      },
    ],
    structure: {
      [fixtureIds.rootStructureKey]: {
        [fixtureIds.objectiveStructureKey]: {},
      },
    },
    prototypes: [
      {
        _id: fixtureIds.rootPrototypeId,
        structureKey: fixtureIds.rootStructureKey,
        depthPadding: 0,
      },
      {
        _id: fixtureIds.objectivePrototypeId,
        structureKey: fixtureIds.objectiveStructureKey,
        depthPadding: 0,
      },
    ],
    files: [
      {
        _id: fixtureIds.missionFileId,
        alias: 'mission-brief.txt',
        lastKnownName: 'mission-brief.txt',
        initialAccess: [],
        reference: fixtureIds.fileReferenceId,
      },
    ],
    effects: [createMissionEffect('1', 'session-start')],
    forces: [
      createForce(fixtureIds, {
        localKey: '1',
        name: 'Blue Force',
        color: Mission.BLUE,
        introMessage: 'Blue force intro',
        revealAllNodes: false,
        fuelBalance:
          FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES.BLUE_FORCE_INITIAL_BALANCE,
        intelBalance:
          INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES.BLUE_FORCE_INITIAL_BALANCE,
        intelExcluded: false,
      }),
      createForce(fixtureIds, {
        localKey: '2',
        name: 'Red Force',
        color: Mission.RED,
        introMessage: 'Red force intro',
        revealAllNodes: true,
        fuelBalance:
          FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES.RED_FORCE_INITIAL_BALANCE,
        intelBalance:
          INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES.RED_FORCE_INITIAL_BALANCE,
        intelExcluded: true,
      }),
    ],
  }
}

function createMissionEffect(
  localKey: string,
  trigger: TEffectSessionTriggeredJson['trigger'],
): TEffectSessionTriggeredJson {
  return {
    _id: TestToolbox.generateRandomId(),
    targetId: 'delay',
    environmentId: 'metis',
    targetEnvironmentVersion: '0.2.1',
    trigger,
    order: Number(localKey) - 1,
    name: `Session Effect ${localKey}`,
    description: `Session effect ${localKey}`,
    args: {
      delayTimeHours: 0,
      delayTimeMinutes: 0,
      delayTimeSeconds: 1,
    },
    localKey,
  }
}

function createForce(
  fixtureIds: TMissionFixtureIds,
  config: TForceFixtureConfig,
): TMissionForceJson {
  return {
    _id: TestToolbox.generateRandomId(),
    introMessage: config.introMessage,
    name: config.name,
    color: config.color,
    resourcePools: [
      {
        _id: TestToolbox.generateRandomId(),
        localKey: '1',
        resourceId: fixtureIds.fuelResourceId,
        initialBalance: config.fuelBalance,
        allowNegative: false,
        excluded: false,
      },
      {
        _id: TestToolbox.generateRandomId(),
        localKey: '2',
        resourceId: fixtureIds.intelResourceId,
        initialBalance: config.intelBalance,
        allowNegative: true,
        excluded: config.intelExcluded,
      },
    ],
    revealAllNodes: config.revealAllNodes,
    localKey: config.localKey,
    nodes: [
      createNode({
        localKey: '1',
        prototypeId: fixtureIds.rootPrototypeId,
        name: `${config.name} Root`,
        color: Mission.BLUE,
        description: `${config.name} root description`,
      }),
      createNode({
        localKey: '2',
        prototypeId: fixtureIds.objectivePrototypeId,
        name: `${config.name} Objective`,
        color: Mission.GREEN,
        description: `${config.name} objective description`,
        preExecutionText: 'Execute the action from here.',
        executable: true,
        actions: [createAction(fixtureIds, '1')],
      }),
    ],
  }
}

function createNode(data: TNodeData): TMissionNodeJson {
  let node = {
    ...SAVE_NODE_DEFAULT_PROPERTIES,
    _id: TestToolbox.generateRandomId(),
    localKey: data.localKey,
    prototypeId: data.prototypeId,
    name: data.name,
    color: data.color,
    description: `${data.name} description`,
  }

  if (data.preExecutionText) {
    node.preExecutionText = data.preExecutionText
  }

  if (data.executable !== undefined) {
    node.executable = data.executable
  }

  if (data.actions) {
    node.actions = data.actions
  }

  return node
}

function createAction(
  fixtureIds: TMissionFixtureIds,
  localKey: string,
): TMissionActionJson {
  return {
    _id: TestToolbox.generateRandomId(),
    name: `Action ${localKey}`,
    description: `Action description ${localKey}`,
    type: MissionAction.DEFAULT_PROPERTIES.type,
    baseProcessTime: MissionAction.DEFAULT_PROPERTIES.baseProcessTime,
    processTimeHidden: MissionAction.DEFAULT_PROPERTIES.processTimeHidden,
    baseSuccessChance: 0.75,
    successChanceHidden: MissionAction.DEFAULT_PROPERTIES.successChanceHidden,
    resourceCosts: [
      {
        _id: TestToolbox.generateRandomId(),
        resourceId: fixtureIds.fuelResourceId,
        baseAmount: 15,
        hidden: false,
      },
      {
        _id: TestToolbox.generateRandomId(),
        resourceId: fixtureIds.intelResourceId,
        baseAmount: 5,
        hidden: true,
      },
    ],
    opensNode: MissionAction.DEFAULT_PROPERTIES.opensNode,
    opensNodeHidden: MissionAction.DEFAULT_PROPERTIES.opensNodeHidden,
    localKey,
    effects: [createActionEffect('1', 'execution-success')],
  }
}

function createActionEffect(
  localKey: string,
  trigger: TEffectExecutionTriggeredJson['trigger'],
): TEffectExecutionTriggeredJson {
  return {
    _id: TestToolbox.generateRandomId(),
    targetId: 'delay',
    environmentId: 'metis',
    targetEnvironmentVersion: '0.2.1',
    trigger,
    order: Number(localKey) - 1,
    name: `Execution Effect ${localKey}`,
    description: `Execution effect ${localKey}`,
    args: {
      delayTimeHours: 0,
      delayTimeMinutes: 0,
      delayTimeSeconds: 1,
    },
    localKey,
  }
}

export type TMissionCreatePayload = Omit<
  TMissionSaveJson,
  | '_id'
  | 'createdAt'
  | 'updatedAt'
  | 'launchedAt'
  | 'createdBy'
  | 'createdByUsername'
>

type TMissionFixtureIds = {
  fuelResourceId: string
  intelResourceId: string
  rootPrototypeId: string
  objectivePrototypeId: string
  rootStructureKey: string
  objectiveStructureKey: string
  missionFileId: string
  fileReferenceId: string
}

type TForceFixtureConfig = {
  localKey: string
  name: string
  color: string
  introMessage: string
  revealAllNodes: boolean
  fuelBalance: number
  intelBalance: number
  intelExcluded: boolean
}

type TNodeData = {
  localKey: string
  prototypeId: string
  name: string
  color: string
  description: string
  preExecutionText?: string
  executable?: boolean
  actions?: TMissionActionJson[]
}
