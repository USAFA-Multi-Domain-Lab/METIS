import {
  serializeJson,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { TMission } from './Mission'
import type { TMissionComponentIssue } from './MissionComponent'
import { MissionComponent } from './MissionComponent'

/**
 * Represents a named resource defined at the mission level. Each resource
 * is a distinct currency that forces can hold and spend when executing actions.
 * Forces reference resources by `_id` via their {@link ResourcePool} entries, and
 * actions deduct from one or more resources via their resource costs.
 * @implements {TJsonSerializable<TMissionResourceJson>}
 */
export class MissionResource<
  T extends TMetisBaseComponents = TMetisBaseComponents,
>
  extends MissionComponent<T, MissionResource<T>>
  implements TJsonSerializable<TMissionResourceJson>
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
   * The icon to display for this resource.
   */
  public icon: TMetisIcon

  /**
   * Controls the left-to-right rendering order of resource pools in the UI.
   * Lower values appear first.
   */
  public order: number

  // Implemented
  public get json(): TMissionResourceJson {
    return this.serialize()
  }

  /**
   * @param mission The mission that owns this resource definition.
   * @param _id The unique identifier for this resource.
   * @param name The display name for this resource.
   * @param icon The icon to display for this resource.
   * @param order The rendering order for this resource.
   */
  protected constructor(
    mission: TMission<T>,
    _id: string,
    name: string,
    icon: TMetisIcon,
    order: number,
  ) {
    super(_id, name, false)
    this.mission = mission
    this.icon = icon
    this.order = order
  }

  // Implemented
  public serialize(): TMissionResourceJson {
    return serializeJson(this, ['_id', 'name', 'icon', 'order'])
  }

  /**
   * Removes the resource from the mission via {@link Mission.removeResource}.
   */
  public remove() {
    this.mission.removeResource(this._id)
  }

  /**
   * The ordered list of icons available for resources, matching the
   * order presented in the resource icon selector UI.
   */
  public static readonly ICONS: readonly TMetisIcon[] = [
    'resources/coins',
    'resources/trophy',
    'resources/flag',
    'resources/gear',
    'resources/key',
    'resources/lightning',
    'resources/node',
    'resources/shield',
    'resources/waves',
    'resources/launch',
    'resources/user',
    'resources/copy',
  ]

  /**
   * The default display names for each resource icon, used when
   * a new resource is created without an explicit name.
   */
  public static readonly DEFAULT_NAMES: Readonly<
    Partial<Record<TMetisIcon, string>>
  > = {
    'resources/coins': 'Resources',
    'resources/trophy': 'Points',
    'resources/flag': 'Budget',
    'resources/gear': 'Manpower',
    'resources/key': 'Fuel',
    'resources/lightning': 'Supplies',
    'resources/node': 'Direct Support',
    'resources/shield': 'Technology',
    'resources/waves': 'Influence',
    'resources/launch': 'Influence',
    'resources/user': 'Public Support',
    'resources/copy': 'Force Morale',
  }

  /**
   * Returns the first icon in {@link ICONS} not already used by
   * an existing resource in the mission. Falls back to the first
   * icon if all are somehow in use.
   */
  private static getNextUnusedIcon<T extends TMetisBaseComponents>(
    mission: TMission<T>,
  ): TMetisIcon {
    let usedIcons = new Set(mission.resources.map((resource) => resource.icon))
    return (
      MissionResource.ICONS.find((icon) => !usedIcons.has(icon)) ??
      MissionResource.ICONS[0]
    )
  }

  /**
   * @param mission The mission that owns this resource definition.
   * @param name The display name for the resource. If omitted, defaults to
   * the name in {@link DEFAULT_NAMES} for the resolved icon.
   * @param icon The icon to display for the resource. If omitted, defaults to
   * the next unused icon via {@link getNextUnusedIcon}.
   * @returns A new {@link MissionResource} object.
   */
  public static createNew<
    T extends TMetisBaseComponents = TMetisBaseComponents,
  >(mission: TMission<T>, name?: string, icon?: TMetisIcon): T['resource'] {
    let order =
      Math.max(...mission.resources.map((resource) => resource.order), 1) + 1
    let resolvedIcon = icon ?? MissionResource.getNextUnusedIcon(mission)
    let resolvedName =
      name ??
      MissionResource.DEFAULT_NAMES[resolvedIcon] ??
      MissionResource.DEFAULT_PROPERTIES.name
    return new MissionResource<T>(
      mission,
      StringToolbox.generateRandomId(),
      resolvedName,
      resolvedIcon,
      order,
    )
  }

  /**
   * Creates a detached {@link ResourcePool} which is a reference
   * to a resource that cannot be found and has likely been deleted.
   * @param mission The mission that owns this resource.
   * @param _id The unique identifier of the detached resource.
   * @param name The display name of the detached resource.
   * @param icon The icon to display for the detached resource, defaults to 'coins'.
   * @returns A detached {@link MissionResource} instance.
   */
  public static createDetached<
    T extends TMetisBaseComponents = TMetisBaseComponents,
  >(
    mission: TMission<T>,
    _id: string,
    name: string,
    icon: TMetisIcon = MissionResource.DEFAULT_PROPERTIES.icon,
  ): T['resource'] {
    return new MissionResource<T>(mission, _id, name, icon, 0)
  }

  /**
   * Creates a {@link MissionResource} from JSON data.
   * @param mission The mission that owns this resource definition.
   * @param data The JSON data from which to create the resource.
   * @returns The new {@link MissionResource} object created from the JSON.
   */
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    mission: TMission<T>,
    data: TMissionResourceJson,
  ): T['resource']
  /**
   * Creates a {@link JsonSerializableArray} of {@link MissionResource} objects from an array of JSON data.
   * @param mission The mission that owns the resource definitions.
   * @param data The array of JSON data from which to create the resources.
   * @returns A {@link JsonSerializableArray} of {@link MissionResource} objects.
   */
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    mission: TMission<T>,
    data: TMissionResourceJson[],
  ): JsonSerializableArray<T['resource']>
  // Actual implementation.
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    mission: TMission<T>,
    data: TMissionResourceJson | TMissionResourceJson[],
  ): T['resource'] | JsonSerializableArray<T['resource']> {
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map(
          (datum) =>
            new MissionResource<T>(
              mission,
              datum._id,
              datum.name,
              datum.icon,
              datum.order,
            ),
        ),
      )
    }
    return new MissionResource<T>(
      mission,
      data._id,
      data.name,
      data.icon,
      data.order,
    )
  }

  /**
   * The default properties for a {@link MissionResource} object.
   */
  public static get DEFAULT_PROPERTIES(): TMissionResourceJson {
    return {
      _id: StringToolbox.generateRandomId(),
      name: 'Resources',
      icon: 'resources/coins',
      order: 1,
    }
  }
}

/* -- TYPES -- */

/**
 * The JSON representation of {@link MissionResource}.
 */
export type TMissionResourceJson = {
  /**
   * @see {@link MissionResource._id}
   */
  _id: string
  /**
   * @see {@link MissionResource.name}
   */
  name: string
  /**
   * @see {@link MissionResource.icon}
   */
  icon: TMetisIcon
  /**
   * @see {@link MissionResource.order}
   */
  order: number
}
