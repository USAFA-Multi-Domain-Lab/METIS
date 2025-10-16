import { TMetisClientComponents } from 'src'
import ClientTarget from 'src/target-environments/targets'
import { TCreateJsonType } from '../../../../shared'
import MissionAction, {
  TMissionActionJson,
  TMissionActionJsonDirect,
  TMissionActionJsonIndirect,
} from '../../../../shared/missions/actions'
import {
  TEffectExecutionTriggered,
  TEffectExecutionTriggeredJson,
} from '../../../../shared/missions/effects'
import { ClientEffect } from '../effects'
import ClientMissionNode from '../nodes'

/**
 * Class representing a mission action on the client-side.
 */
export default class ClientMissionAction extends MissionAction<TMetisClientComponents> {
  /**
   * The formatted success chance to display to a session
   * member.
   */
  public get successChanceFormatted(): string {
    // If the success chance is hidden, return `HIDDEN_VALUE`.
    if (this.successChanceHidden) return ClientMissionAction.HIDDEN_VALUE
    // Convert the value to a percentage format.
    return `${this.successChance * 100}%`
  }

  /**
   * How many hours the action takes to complete.
   */
  public get processTimeHours(): number {
    return Math.floor(this.processTime / 1000 / 60 / 60)
  }

  /**
   * How many minutes the action takes to complete.
   */
  public get processTimeMinutes(): number {
    return Math.floor((this.processTime / 1000 / 60) % 60)
  }

  /**
   * How many seconds the action takes to complete.
   */
  public get processTimeSeconds(): number {
    return Math.floor((this.processTime / 1000) % 60)
  }

  /**
   * The formatted process time to display to a session
   * member.
   */
  public get processTimeFormatted(): string {
    // If the process time is hidden, return the hidden
    // value.
    if (this.processTimeHidden) return ClientMissionAction.HIDDEN_VALUE

    // Return the formatted process time.
    const { processTimeHours, processTimeMinutes, processTimeSeconds } = this
    const hours = processTimeHours > 0 ? `${processTimeHours}h` : ''
    const minutes =
      hours || processTimeMinutes > 0 ? `${processTimeMinutes}m` : ''
    const seconds = `${processTimeSeconds}s`
    return `${hours} ${minutes} ${seconds}`.trim()
  }

  /**
   * The formatted resource cost to display to a session
   * member.
   */
  public get resourceCostFormatted(): string {
    // If the resource cost is hidden, return `HIDDEN_VALUE`.
    if (this.resourceCostHidden) return ClientMissionAction.HIDDEN_VALUE
    // Convert the value to a negative format.
    return `${-this.resourceCost} ${this.mission.resourceLabel}`
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
   * Creates a new action with the provided data.
   * @param node The node to which the action belongs.
   * @param data The data to use for the action.
   * @returns A new action with the provided data.
   */
  public static create(
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
