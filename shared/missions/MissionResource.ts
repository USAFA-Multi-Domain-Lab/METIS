import {
  serializeJson,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
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
export abstract class MissionResource<
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
