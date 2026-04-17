import type { TMissionOutlineItem } from '@client/components/pages/missions/structures/MissionOutline'
import type { TMetisClientComponents } from '@client/index'
import type { ClientTarget } from '@client/target-environments/ClientTarget'
import type { TActionResourceCostJson } from '@shared/missions/actions/ActionResourceCost'
import type {
  TActionModifier,
  TMissionActionJsonDirect,
  TMissionActionJsonIndirect,
} from '@shared/missions/actions/MissionAction'
import { MissionAction } from '@shared/missions/actions/MissionAction'
import type {
  TEffectExecutionTriggered,
  TEffectExecutionTriggeredJson,
} from '@shared/missions/effects/Effect'
import { JsonSerializableArray } from '@shared/toolbox/arrays/JsonSerializableArray'
import { ClientEffect } from '../effects/ClientEffect'
import type { ClientMissionNode } from '../nodes/ClientMissionNode'
import { ClientActionCost } from './ClientActionCost'

/**
 * Class representing a mission action on the client-side.
 */
export class ClientMissionAction
  extends MissionAction<TMetisClientComponents>
  implements TMissionOutlineItem
{
  /**
   * The formatted success chance to display to a session
   * member.
   */
  public get successChanceFormatted(): string {
    return ClientMissionAction.formatSuccessChance(
      this.successChance,
      this.successChanceHidden,
    )
  }

  /**
   * How many hours the action takes to complete by default.
   */
  public get baseProcessTimeHours(): number {
    return Math.floor(this.baseProcessTime / 1000 / 60 / 60)
  }

  /**
   * How many minutes the action takes to complete by default.
   */
  public get baseProcessTimeMinutes(): number {
    return Math.floor((this.baseProcessTime / 1000 / 60) % 60)
  }

  /**
   * How many seconds the action takes to complete by default.
   */
  public get baseProcessTimeSeconds(): number {
    return Math.floor((this.baseProcessTime / 1000) % 60)
  }

  /**
   * How many hours the action takes to complete after any
   * modifiers are applied.
   */
  public get processTimeHours(): number {
    return Math.floor(this.processTime / 1000 / 60 / 60)
  }

  /**
   * How many minutes the action takes to complete after any
   * modifiers are applied.
   */
  public get processTimeMinutes(): number {
    return Math.floor((this.processTime / 1000 / 60) % 60)
  }

  /**
   * How many seconds the action takes to complete after any
   * modifiers are applied.
   */
  public get processTimeSeconds(): number {
    return Math.floor((this.processTime / 1000) % 60)
  }

  /**
   * The formatted process time to display to a session
   * member.
   */
  public get processTimeFormatted(): string {
    return ClientMissionAction.formatProcessTime(
      this.processTime,
      this.processTimeHidden,
    )
  }

  /**
   * The formatted resource cost to display to a session
   * member.
   */
  public get resourceCostFormatted(): string {
    let individualFormattedCosts = this.resourceCosts
      .filter(({ amount }) => amount > 0)
      .map(
        ({ amount, hidden, resource }) =>
          `${hidden ? '?' : amount.toLocaleString('en-US')} ${resource.name}`,
      )

    if (individualFormattedCosts.length === 0) {
      return 'None'
    } else {
      return individualFormattedCosts.join(', ')
    }
  }

  /**
   * The formatted opens node property to display to a
   * session member.
   */
  public get opensNodeFormatted(): string {
    // If the opens node is hidden, return `HIDDEN_VALUE`.
    if (this.opensNodeHidden) return ClientMissionAction.HIDDEN_VALUE
    // Return 'Yes' if the value is true, otherwise 'No'.
    return this.opensNode ? 'Yes' : 'No'
  }

  // Implemented
  public readonly outlineIcon: TMetisIcon = 'lightning'

  // Implemented
  public expandedInOutline: boolean = false

  // Implemented
  public get outlineChildren(): TMissionOutlineItem[] {
    return this.effects
  }

  // Implemented
  public get outlineParent(): TMissionOutlineItem | null {
    return this.node
  }

  /**
   * @param node The node that the action belongs to.
   * @param data The action data from which to create the action.
   * @note Any ommitted values will be set to their default properties
   *  defined in `ClientMissionAction.DEFAULT_PROPERTIES`.
   */
  private constructor(
    node: ClientMissionNode,
    data: Partial<TClientMissionActionJson> = ClientMissionAction.DEFAULT_PROPERTIES,
  ) {
    super(node, data)
  }

  // Implemented
  protected parseCosts(
    data: TActionResourceCostJson[],
  ): JsonSerializableArray<ClientActionCost> {
    return ClientActionCost.fromJson(this, data)
  }

  // Implemented
  protected parseEffects(
    data: TEffectExecutionTriggeredJson[],
  ): ClientEffect<'executionTriggeredEffect'>[] {
    return data.map((datum) =>
      ClientEffect.fromExecutionTriggeredJson(datum, this),
    )
  }

  // Implemented
  public createEffect(
    target: ClientTarget,
    trigger: TEffectExecutionTriggered,
  ): ClientEffect<'executionTriggeredEffect'> {
    let effect = ClientEffect.createBlankExecutionEffect(target, this, trigger)
    this.effects.push(effect)
    return effect
  }

  /**
   * Duplicates the action, creating a new action with the same properties
   * as this one or with the provided properties.
   * @param options The options for duplicating the action.
   * @param options.node The node to which the duplicated action belongs.
   * @param options.name The name of the duplicated action.
   * @param options.localKey The local key of the duplicated action.
   * @returns A new action with the same properties as this one or with the
   * provided properties.
   */
  public duplicate(options: TDuplicateActionOptions = {}): ClientMissionAction {
    // Gather details.
    const {
      node = this.node,
      name = this.name,
      localKey = this.localKey,
    } = options

    // Build data then initialize certain properties.
    const data = {
      ...this.toJson(),
      name,
      localKey,
      _id: ClientMissionAction.DEFAULT_PROPERTIES._id,
      effects: [],
    }

    let duplicatedAction = new ClientMissionAction(node, data)

    // Duplicate the effects.
    duplicatedAction.effects = this.effects.map((effect) => {
      return effect.duplicate({
        context: {
          type: 'executionTriggeredEffect',
          trigger: effect.trigger,
          sourceAction: duplicatedAction,
          get sourceNode() {
            return this.sourceAction.node
          },
          get sourceForce() {
            return this.sourceAction.force
          },
          get sourceMission() {
            return this.sourceAction.mission
          },
          get host() {
            return this.sourceAction
          },
        },
      })
    })

    return duplicatedAction
  }

  /**
   * Callback for when a mission's resource list changes
   * or when an action is first created, allowing the action
   * to confirm that the action's list of resource costs still
   * corresponds with the available resources in the mission.
   */
  public onResourceListUpdate(): void {
    // Map resources to costs, this will result in
    // costs that no longer have a corresponding resource
    // in the mission being filtered out indirectly. New
    // costs are returned in the map for any resource that
    // doesn't have a corresponding cost. Because map is over
    // resources, the list of costs will end up in the same
    // order as the resources, which will be user friendly in
    // the UI.
    this.resourceCosts = new JsonSerializableArray(
      ...this.mission.resources.map((resource) => {
        let existingCost = this.resourceCosts.find(
          ({ resourceId }) => resourceId === resource._id,
        )
        return existingCost ?? ClientActionCost.createNew(this, resource)
      }),
    )
  }

  /**
   * Callback for when a new modifier has been applied to the action.
   * @param modifier The modifier that was applied to the action.
   */
  public onModify(modifier: TActionModifier): void {
    this.modifiers.push(modifier)
  }

  /**
   * Creates a new action with the provided data.
   * @param node The node to which the action belongs.
   * @param data The data to use for the action.
   * @returns A new action with the provided data.
   */
  public static fromJson(
    node: ClientMissionNode,
    data: Partial<TClientMissionActionJson> = ClientMissionAction.DEFAULT_PROPERTIES,
  ): ClientMissionAction {
    return new ClientMissionAction(node, data)
  }

  /**
   * @returns A new `ClientMissionFile` instance that
   * represents a file that is referenced in a effect
   * but not currently found in the mission files.
   */
  public static createDetached(
    _id: string,
    name: string,
    node: ClientMissionNode,
  ): ClientMissionAction {
    return new ClientMissionAction(node, {
      _id,
      name,
    })
  }

  /**
   * @param successChance The success chance value to format.
   * @param successChanceHidden Whether the success chance is actively hidden from view.
   * @returns The formatted value.
   */
  public static formatSuccessChance(
    successChance: number,
    successChanceHidden: boolean = false,
  ): string {
    // If the success chance is hidden, return `HIDDEN_VALUE`.
    if (successChanceHidden) return ClientMissionAction.HIDDEN_VALUE
    // Convert the value to a percentage format.
    return `${successChance * 100}%`
  }

  /**
   * @param successChance The success chance value to format.
   * @param successChanceHidden Whether the success chance is actively hidden from view.
   * @returns The formatted value.
   */
  public static formatProcessTime(
    processTime: number,
    processTimeHidden: boolean = false,
  ): string {
    // If the process time is hidden, return `HIDDEN_VALUE`.
    if (processTimeHidden) return ClientMissionAction.HIDDEN_VALUE

    let hours = Math.floor(processTime / 1000 / 60 / 60)
    let minutes = Math.floor((processTime / 1000 / 60) % 60)
    let seconds = Math.floor((processTime / 1000) % 60)
    let hoursFormatted = hours > 0 ? `${hours}h` : ''
    let minutesFormatted = hoursFormatted || minutes > 0 ? `${minutes}m` : ''
    let secondsFormatted = `${seconds}s`

    return `${hoursFormatted} ${minutesFormatted} ${secondsFormatted}`.trim()
  }

  /**
   * Display for an action property that is hidden
   * from the user.
   */
  public static readonly HIDDEN_VALUE: string = '???'
}

/* ------------------------------ CLIENT ACTION TYPES ------------------------------ */

/**
 * Plain JSON representation of a `MissionAction` object.
 * @note This is a carbon copy of the `TMissionActionJson` type
 * from the shared library and is used to temporarily fix the
 * any issue that happens when importing from the shared
 * library.
 * @see {@link TMissionActionJson}
 */
type TClientMissionActionJson = TCreateJsonType<
  ClientMissionAction,
  TMissionActionJsonDirect,
  TMissionActionJsonIndirect
>

/**
 * The options for duplicating an action.
 * @see {@link ClientMissionAction.duplicate}
 */
type TDuplicateActionOptions = {
  /**
   * The node to which the duplicated action belongs.
   */
  node?: ClientMissionNode
  /**
   * The name of the duplicated action.
   */
  name?: string
  /**
   * The local key of the duplicated action.
   */
  localKey?: string
}

/**
 * Options for formatting an action property for display to a session
 * member.
 * @see {@link ClientMissionAction.formatSuccessChance}
 */
type TActionPropertyFormatOptions = {
  /**
   * Formats the property based on a provided
   * timestamp, which represents the time when the
   * action was executed. With this, only the effective
   * value of the property will be displayed at that time.
   * Any modifiers that were applied after that time will
   * be ignored.
   */
  executedAt?: number
}
