import { targetEnvLogger } from '@server/logging'
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
import type { TEffectType } from '../../../shared/missions/effects/Effect'
import type { SessionServer } from '../../sessions/SessionServer'
import { TargetEnvStore } from '../../sessions/TargetEnvStore'
import { OutdatedContextError } from './OutdatedContextError'

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
   * @see {@link _instanceId}
   */
  protected readonly _instanceId: string

  /**
   * The instance ID for which the current context was
   * generated. This is not necessarily the same as the
   * current session instance ID.
   */
  protected get instanceId() {
    return this._instanceId
  }

  /**
   * The ID of the target environment for the current context.
   */
  protected abstract get environmentId(): string

  /**
   * A store that is unique to the session and target environment.
   */
  protected get localStore() {
    return TargetEnvStore.get(
      this.sessionId,
      this.instanceId,
      this.environmentId,
    )
  }

  /**
   * A store that is unique to the session, but not to any particular
   * target environment. This allows for data to be shared across different
   * target environments within the same session.
   */
  protected get globalStore() {
    return TargetEnvStore.get(this.sessionId, this.instanceId)
  }

  /**
   * @param session The session for the current context.
   */
  protected constructor(session: SessionServer) {
    this.session = session
    this._instanceId = session.instanceId
  }

  /**
   * Creates a limited context to expose to the target
   * environment scripts.
   */
  public abstract expose(): TExposedContext

  /**
   * Executes the provided operation if the context is still current.
   * This means the state is still "started" and the instance ID of
   * the context matches that of the session.
   * @param operation The operation to execute if the context is current.
   * @returns A wrapper that executes the operation if the context is current.
   */
  protected ifContextIsCurrent<TArgs extends any[], TReturn>(
    operation: (...args: TArgs) => TReturn,
  ): (...args: TArgs) => TReturn {
    return (...args: TArgs): TReturn => {
      let errorFirstSentence = `Cannot perform target-environment callback operation.`
      let errorThirdSentence = ` This is likely due to delayed asynchronous code execution from the previous session instance.`

      // Abort if the context is no longer current.
      if (this._instanceId !== this.session.instanceId) {
        let message = `${errorFirstSentence} TargetEnvContext instance ID "${this._instanceId}" does not match current session instance ID "${this.session.instanceId}". ${errorThirdSentence}`
        targetEnvLogger.warn(message)
        throw new OutdatedContextError(message)
      }
      if (['unstarted', 'ended'].includes(this.session.state)) {
        let message = `${errorFirstSentence} TargetEnvContext session "${this.sessionId}" is not in "started" state (current state: "${this.session.state}"). ${errorThirdSentence}`
        targetEnvLogger.warn(message)
        throw new OutdatedContextError(message)
      }

      // Execute the operation otherwise.
      return operation(...args)
    }
  }
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
