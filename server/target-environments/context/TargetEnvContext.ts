import type { Mission } from '@shared/missions/Mission'
import type { MissionAction } from '@shared/missions/actions/MissionAction'
import type { Effect } from '@shared/missions/effects/Effect'
import type { MissionFile } from '@shared/missions/files/MissionFile'
import type { MissionForce } from '@shared/missions/forces/MissionForce'
import type { MissionNode } from '@shared/missions/nodes/MissionNode'
import { MissionSession } from '@shared/sessions/MissionSession'
import type { SessionMember } from '@shared/sessions/members/SessionMember'
import type { TargetEnvironment } from '@shared/target-environments/TargetEnvironment'
import type { Target } from '@shared/target-environments/targets/Target'
import type { TTargetEnvConfig } from '@shared/target-environments/types'
import type { TEffectType } from '../../../shared/missions/effects/Effect'
import type { SessionServer } from '../../sessions/SessionServer'
import { TargetEnvStore } from '../../sessions/TargetEnvStore'
import type { ServerTargetEnvironment } from '../ServerTargetEnvironment'

export abstract class TargetEnvContext<TExposedContext extends {}> {
  /**
   * The mission for the current context.
   */
  protected get mission() {
    return this.session.mission
  }

  /**
   * The ID of the mission for the current context.
   */
  protected get missionId() {
    return this.mission._id
  }

  /**
   * The session for the current context.
   */
  protected readonly session: SessionServer

  /**
   * The ID of the session for the current context.
   */
  protected get sessionId() {
    return this.session._id
  }

  /**
   * The target environment for the registered hook
   * that will receive this context.
   */
  protected readonly environment: ServerTargetEnvironment

  /**
   * The ID of the target environment for the current context.
   */
  protected get environmentId(): string {
    return this.environment._id
  }

  /**
   * This list of configurations for this context's target environment
   * that's used within the current session.
   */
  protected get targetEnvConfigs(): TTargetEnvConfig[] {
    return this.environment.configs
  }

  /**
   * The configuration that's been selected for this context's target
   * environment that's used within the current session.
   */
  protected get selectedTargetEnvConfig(): TTargetEnvConfig | null {
    const selectedConfigId =
      this.session.config.targetEnvConfigs[this.environmentId]
    if (!selectedConfigId) return null

    return (
      this.environment.configs.find(
        (config) => config._id === selectedConfigId,
      ) ?? null
    )
  }

  /**
   * A store that is unique to the session and target environment.
   */
  protected get localStore() {
    return TargetEnvStore.getStore(this.sessionId, this.environmentId)
  }

  /**
   * A store that is unique to the session, but not to any particular
   * target environment. This allows for data to be shared across different
   * target environments within the same session.
   */
  protected get globalStore() {
    return TargetEnvStore.getStore(this.sessionId)
  }

  /**
   * @param session The session for the current context.
   * @param environment The target environment for the current context.
   */
  protected constructor(
    session: SessionServer,
    environment: ServerTargetEnvironment,
  ) {
    this.session = session
    this.environment = environment
  }

  /**
   * Creates a limited context to expose to the target
   * environment scripts.
   */
  public abstract expose(): TExposedContext
}

/* -- TYPES -- */

/**
 * Data for a session exposed to target-environment code.
 */
export type TTargetEnvExposedSession = Readonly<
  TCreateJsonType<
    SessionServer,
    '_id' | 'name' | 'config' | 'launchedAt' | 'state',
    {
      /**
       * @see {@link MissionSession.members}
       */
      members: TTargetEnvExposedMember[]
      /**
       * @see {@link MissionSession.participants}
       */
      participants: TTargetEnvExposedMember[]
      /**
       * @see {@link MissionSession.observers}
       */
      observers: TTargetEnvExposedMember[]
      /**
       * @see {@link MissionSession.managers}
       */
      managers: TTargetEnvExposedMember[]
    }
  >
>

/**
 * Data for a mission exposed to target-environment code.
 */
export type TTargetEnvExposedMission = Readonly<
  TCreateJsonType<
    Mission,
    '_id' | 'name' | 'resourceLabel',
    {
      /**
       * @see {@link Mission.forces}
       */
      forces: TTargetEnvExposedForce[]
      /**
       * @see {@link Mission.allNodes}
       */
      allNodes: TTargetEnvExposedNode[]
      /**
       * @see {@link Mission.allActions}
       */
      allActions: TTargetEnvExposedAction[]
      /**
       * @see {@link Mission.allEffects}
       */
      allEffects: TTargetEnvExposedEffect[]
      /**
       * @see {@link Mission.files}
       */
      files: TTargetEnvExposedFile[]
      /**
       * @see {@link Mission.effects}
       */
      effects: TTargetEnvExposedEffect<'sessionTriggeredEffect'>[]
    }
  >
>

/**
 * Data for a force exposed to target-environment code.
 */
export type TTargetEnvExposedForce = Readonly<
  TCreateJsonType<
    MissionForce,
    | '_id'
    | 'localKey'
    | 'name'
    | 'color'
    | 'initialResources'
    | 'resourcesRemaining',
    {
      /**
       * @see {@link MissionForce.mission}
       */
      mission: TTargetEnvExposedMission
      /**
       * @see {@link MissionForce.nodes}
       */
      nodes: TTargetEnvExposedNode[]
    }
  >
>

/**
 * Data for a node exposed to target-environment code.
 */
export type TTargetEnvExposedNode = Readonly<
  TCreateJsonType<
    MissionNode,
    | '_id'
    | 'localKey'
    | 'name'
    | 'description'
    | 'color'
    | 'opened'
    | 'openable'
    | 'closable'
    | 'blocked'
    | 'executing'
    | 'executionStatus'
    | 'executionState'
    | 'executed'
    | 'initiallyBlocked'
    | 'device'
    | 'revealed'
    | 'position'
    | 'hasChildren'
    | 'hasSiblings',
    {
      /**
       * @see {@link MissionForce.mission}
       */
      mission: TTargetEnvExposedMission
      /**
       * @see {@link MissionNode.force}
       */
      force: TTargetEnvExposedForce
      /**
       * @see {@link MissionNode.actions}
       */
      actions: TTargetEnvExposedAction[]
      /**
       * @see {@link MissionNode.parent}
       */
      parent: TTargetEnvExposedNode | null
      /**
       * @see {@link MissionNode.children}
       */
      children: TTargetEnvExposedNode[]
      /**
       * @see {@link MissionNode.siblings}
       */
      siblings: TTargetEnvExposedNode[]
    }
  >
>

/**
 * Data for a file exposed to target-environment code.
 */
export type TTargetEnvExposedFile = Readonly<
  TCreateJsonType<
    MissionFile,
    | '_id'
    | 'name'
    | 'originalName'
    | 'alias'
    | 'extension'
    | 'mimetype'
    | 'initialAccess'
    | 'size',
    {
      /**
       * @see {@link MissionFile.mission}
       */
      mission: TTargetEnvExposedMission
    }
  >
>

/**
 * Data for an action exposed to target-environment code.
 */
export type TTargetEnvExposedAction = Readonly<
  TCreateJsonType<
    MissionAction,
    | '_id'
    | 'localKey'
    | 'name'
    | 'type'
    | 'description'
    | 'successChance'
    | 'failureChance'
    | 'processTime'
    | 'resourceCost'
    | 'areEnoughResources'
    | 'executing'
    | 'executionCount'
    | 'executionLimitReached',
    {
      /**
       * @see {@link MissionAction.mission}
       */
      mission: TTargetEnvExposedMission
      /**
       * @see {@link MissionAction.force}
       */
      force: TTargetEnvExposedForce
      /**
       * @see {@link MissionAction.node}
       */
      node: TTargetEnvExposedNode
      /**
       * @see {@link MissionAction.effects}
       */
      effects: TTargetEnvExposedEffect[]
    }
  >
>

/**
 * Data for an effect exposed to target-environment code.
 */
export type TTargetEnvExposedEffect<TType extends TEffectType = TEffectType> =
  Readonly<
    TCreateJsonType<
      Effect<TMetisBaseComponents, TType>,
      | '_id'
      | 'localKey'
      | 'name'
      | 'type'
      | 'description'
      | 'trigger'
      | 'args'
      | 'order',
      {
        /**
         * @see {@link Effect.mission}
         */
        mission: TTargetEnvExposedMission
        /**
         * @see {@link Effect.host}
         */
        host: TTargetEnvExposedMission | TTargetEnvExposedAction
        /**
         * @see {@link Effect.sourceForce}
         */
        sourceForce: TTargetEnvExposedForce | null
        /**
         * @see {@link Effect.node}
         */
        sourceNode: TTargetEnvExposedNode | null
        /**
         * @see {@link Effect.sourceAction}
         */
        sourceAction: TTargetEnvExposedAction | null
        /**
         * @see {@link Effect.target}
         */
        target: TTargetEnvExposedTarget | null
        /**
         * @see {@link Effect.environment}
         */
        environment: TTargetEnvExposedEnvironment | null
      }
    >
  >

/**
 * Data for a target environment exposed in
 * a target script.
 */
export type TTargetEnvExposedTarget = Readonly<
  TCreateJsonType<
    Target,
    '_id' | 'name' | 'description',
    {
      /**
       * @see {@link Target.environment}
       */
      environment: TTargetEnvExposedEnvironment
    }
  >
>

/**
 * Data for a target exposed to target-environment code.
 */
export type TTargetEnvExposedEnvironment = Readonly<
  TCreateJsonType<
    TargetEnvironment,
    '_id' | 'name' | 'description' | 'version',
    {
      /**
       * @see {@link TargetEnvironment.targets}
       */
      targets: TTargetEnvExposedTarget[]
    }
  >
>

/**
 * Data for a member exposed to target-environment code.
 */
export type TTargetEnvExposedMember = Readonly<
  TCreateJsonType<
    SessionMember,
    '_id' | 'name' | 'username' | 'firstName' | 'lastName',
    {}
  >
>

/**
 * Data for a target environment configuration
 * exposed in a target script.
 */
export type TTargetEnvExposedConfig = Readonly<TTargetEnvConfig>
