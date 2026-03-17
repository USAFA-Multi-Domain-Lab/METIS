import {
  serializeJson,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { TMission } from './Mission'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from './MissionComponent'

/**
 * Represents a named resource defined at the mission level. Each resource
 * is a distinct currency that forces can hold and spend when executing actions.
 * Forces reference resources by `_id` via their {@link ResourcePool} entries, and
 * actions deduct from one or more resources via their resource costs.
 * @implements {TJsonSerializable<TResourceJson>}
 */
export class MissionResource<
  T extends TMetisBaseComponents = TMetisBaseComponents,
>
  extends MissionComponent<T, MissionResource<T>>
  implements TJsonSerializable<TResourceJson>
{
  /**
   * The mission that owns this resource definition.
   */
  public readonly mission: TMission<T>

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [...this.mission.path, this]
  }

  // Implemented
  protected get additionalIssues(): TMissionComponentIssue[] {
    return []
  }

  /**
   * Controls the left-to-right rendering order of resource pools in the UI.
   * Lower values appear first.
   */
  public order: number

  // Implemented
  public get json(): TResourceJson {
    return serializeJson(this, ['_id', 'name', 'order'])
  }

  /**
   * @param mission The mission that owns this resource definition.
   * @param _id The unique identifier for this resource.
   * @param name The display name for this resource.
   * @param order The rendering order for this resource.
   */
  private constructor(
    mission: TMission<T>,
    _id: string,
    name: string,
    order: number,
  ) {
    super(_id, name, false)
    this.mission = mission
    this.order = order
  }

  /**
   * Removes the resource from the mission via {@link Mission.removeResource}.
   */
  public remove() {
    this.mission.removeResource(this._id)
  }

  /**
   * @param mission The mission that owns this resource definition.
   * @param name The display name for the resource, defaults to 'Resources'.
   * @returns A new {@link MissionResource} object.
   */
  public static createNew<
    T extends TMetisBaseComponents = TMetisBaseComponents,
  >(mission: TMission<T>, name: string = 'Resources'): T['resource'] {
    let order =
      Math.max(...mission.resources.map((resource) => resource.order), 1) + 1
    return new MissionResource<T>(
      mission,
      StringToolbox.generateRandomId(),
      name,
      order,
    )
  }

  /**
   * Creates a detached {@link ResourcePool} which is a reference
   * to a resource that cannot be found and has likely been deleted.
   * @param _id The unique identifier of the detached resource.
   * @param name The display name of the detached resource.
   * @param mission The mission that owns this resource.
   * @returns A detached {@link MissionResource} instance.
   */
  public static createDetached<
    T extends TMetisBaseComponents = TMetisBaseComponents,
  >(_id: string, name: string, mission: TMission<T>): T['resource'] {
    return new MissionResource<T>(mission, _id, name, 0)
  }

  /**
   * Creates a {@link MissionResource} from JSON data.
   * @param mission The mission that owns this resource definition.
   * @param data The JSON data from which to create the resource.
   * @returns The new {@link MissionResource} object created from the JSON.
   */
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    mission: TMission<T>,
    data: TResourceJson,
  ): T['resource']
  /**
   * Creates a {@link JsonSerializableArray} of {@link MissionResource} objects from an array of JSON data.
   * @param mission The mission that owns the resource definitions.
   * @param data The array of JSON data from which to create the resources.
   * @returns A {@link JsonSerializableArray} of {@link MissionResource} objects.
   */
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    mission: TMission<T>,
    data: TResourceJson[],
  ): JsonSerializableArray<T['resource']>
  // Actual implementation.
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    mission: TMission<T>,
    data: TResourceJson | TResourceJson[],
  ): T['resource'] | JsonSerializableArray<T['resource']> {
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map(
          (datum) =>
            new MissionResource<T>(mission, datum._id, datum.name, datum.order),
        ),
      )
    }
    return new MissionResource<T>(mission, data._id, data.name, data.order)
  }
}

/* -- TYPES -- */

/**
 * The JSON representation of {@link MissionResource}.
 */
export type TResourceJson = {
  /**
   * @see {@link MissionResource._id}
   */
  _id: string
  /**
   * @see {@link MissionResource.name}
   */
  name: string
  /**
   * @see {@link MissionResource.order}
   */
  order: number
}
