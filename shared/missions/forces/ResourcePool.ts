import {
  createToJsonMethod,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import type { TMission } from '../Mission'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../MissionComponent'
import type { TForce } from './MissionForce'

/**
 * Represents a pool/bank of resources from which a force can withdraw to
 * perform various actions within a mission.
 * @implements {TJsonSerializable<TResourcePoolJson>}
 */
export class ResourcePool<T extends TMetisBaseComponents = TMetisBaseComponents>
  extends MissionComponent<T, ResourcePool<T>>
  implements TJsonSerializable<TResourcePoolJson>
{
  /**
   * The force that owns this resource pool.
   */
  public readonly force: TForce<T>

  // Implemented
  public get mission(): TMission<T> {
    return this.force.mission
  }

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [...this.force.path, this]
  }

  // todo: Resource should be directly accessibly in class. -jms
  /**
   * The label of the resource linked to this pool, derived from the
   * mission's resources list via {@link resourceId}. Falls back to
   * {@link resourceId} if the resource cannot be found.
   */
  // Implemented
  public get name(): string {
    return (
      this.mission.resources.find(
        (resource) => resource._id === this.resourceId,
      )?.name ?? this.resourceId
    )
  }

  // Implemented
  protected get additionalIssues(): TMissionComponentIssue[] {
    return []
  }

  /**
   * The ID of the {@link TResource} this pool tracks.
   */
  public resourceId: string

  /**
   * The amount of resources available at the start of a session.
   */
  public initialAmount: number

  /**
   * Whether the pool is permitted to go below zero.
   */
  public allowNegative: boolean

  /**
   * The current amount of resources remaining in this pool.
   * Initialized from {@link TResourcePoolJson.remainingAmount} if present,
   * otherwise defaults to {@link initialAmount}.
   */
  public remainingAmount: number

  /**
   * @param force The force that owns this resource pool.
   * @param data The JSON data from which to create the pool.
   */
  public constructor(force: TForce<T>, data: TResourcePoolJson) {
    super(data._id, '', false)
    this.force = force
    this.resourceId = data.resourceId
    this.initialAmount = data.initialAmount
    this.allowNegative = data.allowNegative
    this.remainingAmount = data.remainingAmount ?? data.initialAmount
    this.toJson = createToJsonMethod<ResourcePool<T>, TResourcePoolJson>(this, [
      '_id',
      'resourceId',
      'initialAmount',
      'allowNegative',
      'remainingAmount',
    ])
  }

  // Implemented
  public toJson: () => TResourcePoolJson
}

/* -- TYPES -- */

/**
 * The JSON representation of {@link ResourcePool}.
 */
export type TResourcePoolJson = {
  /**
   * The unique identifier for this resource pool entry.
   */
  _id: string
  /**
   * The ID of the {@link TResource} being stored within this pool.
   */
  resourceId: string
  /**
   * The amount of resources available at the start of the session.
   */
  initialAmount: number
  /**
   * Whether the pool can go below zero.
   */
  allowNegative: boolean
  /**
   * The current amount of resources remaining.
   * @note This is a session-only value and is never persisted to the database.
   * @default initialAmount
   */
  remainingAmount?: number
}
