import {
  serializeJson,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { Mission, type TMission } from '../Mission'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../MissionComponent'
import { MissionResource } from '../MissionResource'
import type { TForce, TForceJsonOptions } from './MissionForce'

/**
 * Represents a pool/bank of resources from which a force can withdraw to
 * perform various actions within a mission.
 * @implements {TJsonSerializable<TResourcePoolJson>}
 */
export abstract class ResourcePool<
  T extends TMetisBaseComponents = TMetisBaseComponents,
>
  extends MissionComponent<T, ResourcePool<T>>
  implements TJsonSerializable<TResourcePoolJson, TPoolJsonOptions>
{
  /**
   * The force that owns this resource pool.
   */
  public readonly force: T['force']

  // Implemented
  public get mission(): TMission<T> {
    return this.force.mission
  }

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [...this.force.path, this]
  }

  /**
   * The name of the {@link MissionResource} this pool tracks.
   */
  // Implemented
  public get name(): string {
    return this.resource.name
  }

  // Implemented
  protected get additionalIssues(): TMissionComponentIssue[] {
    return []
  }

  /**
   * The {@link MissionResource} this pool tracks.
   */
  public readonly resource: T['resource']

  /**
   * The ID of the {@link MissionResource} this pool tracks.
   */
  public get resourceId(): string {
    return this.resource._id
  }

  /**
   * A key for the pool, used to identify it within the force.
   */
  public localKey: string

  /**
   * The amount of resources available at the start of a session.
   */
  public initialBalance: number

  /**
   * Whether the pool is permitted to go below zero.
   */
  public allowNegative: boolean

  /**
   * Whether this pool is excluded from the force. An excluded pool
   * is hidden from session participants and its associated costs
   * are not applied or displayed.
   */
  public excluded: boolean

  /**
   * The current amount of resources stored in this pool.
   * Initialized from {@link TResourcePoolJson.balance} if present,
   * otherwise defaults to {@link initialBalance}.
   */
  public balance: number

  /**
   * The icon derived from the {@link resource} tracked
   * by this pool.
   */
  public get icon(): TMetisIcon {
    return this.resource.icon
  }

  // Implemented
  public get json(): TResourcePoolJson {
    return this.serialize()
  }

  /**
   * @param resource The {@link MissionResource} this pool tracks.
   * @param force The force that owns this resource pool.
   * @param _id The unique identifier for this resource pool entry.
   * @param localKey The key used to identify this pool within the force.
   * @param initialBalance The starting amount of resources.
   * @param allowNegative Whether the pool can go below zero.
   * @param excluded Whether this pool is excluded from the force.
   * @param balance The current amount of resources remaining.
   */
  protected constructor(
    resource: T['resource'],
    force: TForce<T>,
    _id: string,
    localKey: string,
    initialBalance: number,
    allowNegative: boolean,
    excluded: boolean,
    balance: number,
  ) {
    super(_id, '', false)
    this.resource = resource
    this.force = force
    this.localKey = localKey
    this.initialBalance = initialBalance
    this.allowNegative = allowNegative
    this.excluded = excluded
    this.balance = balance
  }

  // Implemented
  public serialize(options: TPoolJsonOptions = {}): TResourcePoolJson {
    let { sessionDataExposure = Mission.DEFAULT_SESSION_DATA_EXPOSURE } =
      options

    let json: TResourcePoolJson = serializeJson(this, [
      '_id',
      'localKey',
      'resourceId',
      'initialBalance',
      'allowNegative',
      'excluded',
    ])

    // If session data is requested to be exposed,
    // include remaining amount in the JSON.
    if (sessionDataExposure.expose !== 'none') {
      json.balance = this.balance
    }

    return json
  }

  /**
   * Callback to handle an effect which modifies this pool. Applies
   * the specified operand to the pool's remaining amount. Then propogates
   * the modification event to the owning force for any additional handling.
   * @param operand The value to apply to the pool's remaining amount.
   */
  public onModify(operand: number): void {
    this.balance += operand
    this.force.onModifyPool(this)
  }

  /**
   * The default properties for a {@link ResourcePool} object.
   */
  public static get DEFAULT_PROPERTIES(): Omit<
    TResourcePoolJson,
    'resourceId'
  > {
    return {
      _id: StringToolbox.generateRandomId(),
      localKey: '1',
      initialBalance: 0,
      allowNegative: false,
      excluded: false,
    }
  }
}

/* -- TYPES -- */

/**
 * The JSON representation of {@link ResourcePool}.
 */
export type TResourcePoolJson = {
  /**
   * @see {@link ResourcePool._id}
   */
  _id: string
  /**
   * @see {@link ResourcePool.localKey}
   */
  localKey: string
  /**
   * @see {@link ResourcePool.resourceId}
   */
  resourceId: string
  /**
   * @see {@link ResourcePool.initialBalance}
   */
  initialBalance: number
  /**
   * @see {@link ResourcePool.allowNegative}
   */
  allowNegative: boolean
  /**
   * @see {@link ResourcePool.excluded}
   */
  excluded: boolean
  /**
   * @see {@link ResourcePool.balance}
   */
  balance?: number
}

/**
 * Options for serializing {@link ResourcePool} to JSON.
 */
export type TPoolJsonOptions = Pick<TForceJsonOptions, 'sessionDataExposure'>
