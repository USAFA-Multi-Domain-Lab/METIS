import { targetEnvLogger } from '@server/logging'
import type { ServerMission } from '@server/missions/ServerMission'
import type { ServerMissionResource } from '@server/missions/ServerMissionResource'
import type { ServerActionCost } from '@server/missions/actions/ServerActionCost'
import type { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerEffect } from '@server/missions/effects/ServerEffect'
import type { ServerMissionFile } from '@server/missions/files/ServerMissionFile'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import type { ServerResourcePool } from '@server/missions/forces/ServerResourcePool'
import type { ServerMissionNode } from '@server/missions/nodes/ServerMissionNode'
import type { Mission } from '@shared/missions/Mission'
import type { MissionResource } from '@shared/missions/MissionResource'
import type { ActionResourceCost } from '@shared/missions/actions/ActionResourceCost'
import type { MissionAction } from '@shared/missions/actions/MissionAction'
import type { Effect } from '@shared/missions/effects/Effect'
import type { MissionFile } from '@shared/missions/files/MissionFile'
import type { MissionForce } from '@shared/missions/forces/MissionForce'
import type { ResourcePool } from '@shared/missions/forces/ResourcePool'
import type { MissionNode } from '@shared/missions/nodes/MissionNode'
import type {
  MissionSession,
  TSessionState,
} from '@shared/sessions/MissionSession'
import type { SessionMember } from '@shared/sessions/members/SessionMember'
import type { TargetEnvironment } from '@shared/target-environments/TargetEnvironment'
import type { Target } from '@shared/target-environments/targets/Target'
import type { TTargetEnvConfig } from '@shared/target-environments/types'
import type { TEffectType } from '../../../shared/missions/effects/Effect'
import type { ServerSessionRealm } from '../../sessions/ServerSessionRealm'
import type { SessionServer } from '../../sessions/SessionServer'
import { TargetEnvStore } from '../../sessions/TargetEnvStore'
import type { ServerTargetEnvironment } from '../ServerTargetEnvironment'
import type { TTargetEnvExposedArgument } from '../arguments/ServerTargetArgument'
import { OutdatedContextError } from './OutdatedContextError'

export abstract class TargetEnvContext<
  TExposedContext extends TTargetEnvExposedContext,
> {
  /**
   * A promise that represents the current operation
   * being executed within the context. If null,
   * no operation has been initiated yet.
   */
  protected operationPromise: Promise<void> | null = null

  /**
   * A function that resolves the current operation's promise.
   * This is set when an operation is initiated, and called
   * to resolve the promise when needed.
   */
  protected resolveOperation = () => {}

  /**
   * States that are permitted for operations executed
   * within this context.
   */
  protected abstract readonly permittedStates: TSessionState[]

  /**
   * The realm within which this context operates.
   */
  protected readonly realm: ServerSessionRealm

  /**
   * The mission for the current context, rooted
   * in the provided realm.
   */
  protected get mission() {
    return this.realm.mission
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
  protected get session(): SessionServer {
    return this.realm.session
  }

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
  protected get environmentId(): string {
    return this.environment._id
  }

  /**
   * The target environment for the current context.
   */
  protected readonly environment: ServerTargetEnvironment

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
   * @param realm The realm within which this context operates.
   * @param enviroment The target environment for the current context.
   */
  protected constructor(
    realm: ServerSessionRealm,
    enviroment: ServerTargetEnvironment,
  ) {
    this.realm = realm
    this._instanceId = realm.session.instanceId
    this.environment = enviroment
  }

  /**
   * Utility method to compile together the common exposed context
   * that should be used by all implementations of the {@link expose}
   * method in child classes.
   * @returns The common exposed context.
   */
  protected exposeCommon(): TTargetEnvExposedContext {
    const self = this
    return {
      get session() {
        return self.session.toTargetEnvContext(self.environment)
      },
      get config() {
        return self.session.configToTargetEnvContext(self.environment)
      },
      get mission() {
        return self.mission.toTargetEnvContext()
      },
      localStore: this.localStore,
      globalStore: this.globalStore,
      sleep: this.ifContextIsCurrent(this.sleep.bind(this)),
    }
  }

  /**
   * Creates a limited context to expose to the target
   * environment scripts.
   * @note If you are implementing this abstract method in
   * a child class, it is recommended to utilize the
   * {@link exposeCommon} method to help compile your exposed
   * context.
   * @returns The exposed context.
   */
  protected abstract expose(): TExposedContext

  /**
   * Runs the provided operation within the context, resolving once it
   * settles. This owns only the execution machinery (single-settle
   * guarding and early-resolution on session cleanup); the surrounding
   * task lifecycle (queued -> running -> resolved) and its broadcasting
   * are managed by {@link ServerEnvironmentTask}.
   * @param operation The operation to run.
   * @resolves After the operation has been executed.
   * @rejects If the operation fails.
   * @note This should only ever be called once per context instance.
   */
  public run(
    operation: (context: TExposedContext) => Promise<void>,
  ): Promise<void> {
    // Run should only be called once.
    if (this.operationPromise) {
      throw new Error(
        'Cannot run operation: Another operation has already been initiated within this context.',
      )
    }

    let promise = new Promise<void>((resolve, reject) => {
      let settled = false

      // Wrapper resolve and reject to ensure
      // they are only called once.
      const safeResolve = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const safeReject = (err: unknown) => {
        if (settled) return
        settled = true
        reject(err)
      }

      // Make the safe resolve function available
      // to be called by the session.
      this.resolveOperation = safeResolve

      // Execute the operation.
      operation(this.expose()).then(safeResolve, safeReject)
    })

    this.operationPromise = promise
    return promise
  }

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

  /**
   * @see {@link TTargetEnvExposedContext.sleep}
   */
  protected sleep(duration: number): Promise<void> {
    return new Promise<void>((resolve) => {
      let timeout = setTimeout(() => {
        resolve()
      }, duration)
      this.session.onSleep(() => {
        // If session clean up occurs, abort the
        // sleep early and resolve the operation
        // early. This allows for the session to
        // perform proper clean up without waiting
        // for the script to conclude its work.
        clearTimeout(timeout)
        this.resolveOperation()
      })
    })
  }
}

/* -- TYPES -- */

/**
 * Common context exposed to any target-environment code.
 */
export type TTargetEnvExposedContext = {
  /**
   * The session that invoked the target-environment code.
   */
  readonly session: TTargetEnvExposedSession
  /**
   * The configuration that's been selected for this context's target
   * environment that's used within the current session.
   */
  readonly config: TTargetEnvExposedSessionConfig
  /**
   * The mission associated with the session.
   */
  readonly mission: TTargetEnvExposedMission
  /**
   * A store that is unique to the session instance and the target environment.
   * This can be used to store and retrieve temporary, random-access
   * data.
   */
  readonly localStore: TargetEnvStore
  /**
   * A store that is unique to the session instance, but not to any particular
   * target environment. This allows for data to be shared across different
   * target environments within the same session instance.
   */
  readonly globalStore: TargetEnvStore
  /**
   * Sleeps for the specified duration.
   * @param duration The duration in milliseconds to sleep for.
   * @resolves After the sleep duration has elapsed.
   * @note This will abort early if the session ends before
   * the duration has elapsed.
   * @NOTE IMPORTANT Use `await` in conjunction with this method
   * to ensure the next lines of code are not executed until
   * after the sleep has concluded.
   */
  sleep(duration: number): Promise<void>
}

/**
 * Data for a session exposed to target-environment code.
 */
export interface TTargetEnvExposedSession extends Readonly<
  TCreateJsonType<
    SessionServer,
    '_id' | 'name' | 'launchedAt' | 'state',
    {
      /**
       * @see {@link TTargetEnvExposedSessionConfig}
       */
      config: TTargetEnvExposedSessionConfig
      /**
       * @see {@link MissionSession.members}
       */
      members: TTargetEnvExposedMember[]
      /**
       * @see {@link MissionSession.joinedMembers}
       */
      joinedMembers: TTargetEnvExposedMember[]
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
> {}

/**
 * Data for a session config exposed to target-environment code.
 */
export interface TTargetEnvExposedSessionConfig extends Readonly<
  Pick<MissionSession['config'], 'name' | 'accessibility' | 'infiniteResources'>
> {
  /**
   * The configuration for this target environment.
   * @note If null, no configuration has been selected
   * for this target environment.
   */
  targetEnvConfig: TTargetEnvConfig | null
}

/**
 * Data for a mission exposed to target-environment code.
 */
export interface TTargetEnvExposedMission extends Readonly<
  TCreateJsonType<
    ServerMission,
    '_id' | 'name',
    {
      /**
       * Can be used to determine the type of the component in the
       * target-environment code when the type is not explicitly
       * provided.
       */
      componentType: 'mission'
      /**
       * @see {@link Mission.resources}
       */
      resources: TTargetEnvExposedResource[]
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
> {}

/**
 * Data for a resource exposed to target-environment code.
 */
export interface TTargetEnvExposedResource extends Readonly<
  TCreateJsonType<
    ServerMissionResource,
    '_id' | 'name' | 'icon' | 'order',
    {
      /**
       * Can be used to determine the type of the component in the
       * target-environment code when the type is not explicitly
       * provided.
       */
      componentType: 'resource'
      /**
       * @see {@link MissionResource.mission}
       */
      mission: TTargetEnvExposedMission
    }
  >
> {}

/**
 * Data for a force exposed to target-environment code.
 */
export interface TTargetEnvExposedForce extends Readonly<
  TCreateJsonType<
    ServerMissionForce,
    '_id' | 'localKey' | 'name' | 'color',
    {
      /**
       * Can be used to determine the type of the component in the
       * target-environment code when the type is not explicitly
       * provided.
       */
      componentType: 'force'
      /**
       * @see {@link MissionForce.mission}
       */
      mission: TTargetEnvExposedMission
      /**
       * @see {@link MissionForce.nodes}
       */
      nodes: TTargetEnvExposedNode[]
      /**
       * @see {@link MissionForce.resourcePools}
       */
      resourcePools: TTargetEnvExposedPool[]
    }
  >
> {}

/**
 * Data for a resource pool exposed to target-environment code.
 */
export interface TTargetEnvExposedPool extends Readonly<
  TCreateJsonType<
    ServerResourcePool,
    | '_id'
    | 'localKey'
    | 'name'
    | 'initialBalance'
    | 'allowNegative'
    | 'excluded',
    {
      /**
       * Can be used to determine the type of the component in the
       * target-environment code when the type is not explicitly
       * provided.
       */
      componentType: 'resourcePool'
      /**
       * @see {@link ResourcePool.mission}
       */
      mission: TTargetEnvExposedMission
      /**
       * @see {@link ResourcePool.force}
       */
      force: TTargetEnvExposedForce
      /**
       * @see {@link ResourcePool.resource}
       */
      resource: TTargetEnvExposedResource
      /**
       * @see {@link ResourcePool.balance}
       */
      balance: number // Make balance required.
    }
  >
> {}

/**
 * Data for a node exposed to target-environment code.
 */
export interface TTargetEnvExposedNode extends Readonly<
  TCreateJsonType<
    ServerMissionNode,
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
       * Can be used to determine the type of the component in the
       * target-environment code when the type is not explicitly
       * provided.
       */
      componentType: 'node'
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
> {}

/**
 * Data for a file exposed to target-environment code.
 */
export interface TTargetEnvExposedFile extends Readonly<
  TCreateJsonType<
    ServerMissionFile,
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
       * Can be used to determine the type of the component in the
       * target-environment code when the type is not explicitly
       * provided.
       */
      componentType: 'missionFile'
      /**
       * @see {@link MissionFile.mission}
       */
      mission: TTargetEnvExposedMission
    }
  >
> {}

/**
 * Data for an action exposed to target-environment code.
 */
export interface TTargetEnvExposedAction extends Readonly<
  TCreateJsonType<
    ServerMissionAction,
    | '_id'
    | 'localKey'
    | 'name'
    | 'type'
    | 'description'
    | 'successChance'
    | 'failureChance'
    | 'processTime'
    | 'areEnoughResources'
    | 'executing'
    | 'executionCount'
    | 'executionLimitReached',
    {
      /**
       * Can be used to determine the type of the component in the
       * target-environment code when the type is not explicitly
       * provided.
       */
      componentType: 'action'
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
       * @see {@link MissionAction.resourceCosts}
       */
      resourceCosts: TTargetEnvExposedCost[]
      /**
       * @see {@link MissionAction.effects}
       */
      effects: TTargetEnvExposedEffect[]
    }
  >
> {}

/**
 * Data for a resource cost exposed to target-environment code.
 */
export interface TTargetEnvExposedCost extends Readonly<
  TCreateJsonType<
    ServerActionCost,
    '_id' | 'name' | 'baseAmount' | 'hidden' | 'amount' | 'icon',
    {
      /**
       * @see {@link ActionResourceCost.resource}
       */
      resource: TTargetEnvExposedResource
      /**
       * @see {@link ActionResourceCost.mission}
       */
      mission: TTargetEnvExposedMission
      /**
       * @see {@link ActionResourceCost.force}
       */
      force: TTargetEnvExposedForce
      /**
       * @see {@link ActionResourceCost.node}
       */
      node: TTargetEnvExposedNode
      /**
       * @see {@link ActionResourceCost.action}
       */
      action: TTargetEnvExposedAction
    }
  >
> {}

/**
 * Data for an effect exposed to target-environment code.
 */
export interface TTargetEnvExposedEffect<
  TType extends TEffectType = TEffectType,
> extends Readonly<
  TCreateJsonType<
    ServerEffect<TType>,
    '_id' | 'localKey' | 'name' | 'type' | 'description' | 'trigger' | 'order',
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
      /**
       * @see {@link Effect.arguments}
       */
      arguments: TTargetEnvExposedArgument[]
    }
  >
> {}

/**
 * Data for a target environment exposed in
 * a target script.
 */
export interface TTargetEnvExposedTarget extends Readonly<
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
> {}

/**
 * Data for a target exposed to target-environment code.
 */
export interface TTargetEnvExposedEnvironment extends Readonly<
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
> {}

/**
 * Data for a member exposed to target-environment code.
 */
export interface TTargetEnvExposedMember extends Readonly<
  TCreateJsonType<
    SessionMember,
    '_id' | 'name' | 'username' | 'firstName' | 'lastName',
    {}
  >
> {}
