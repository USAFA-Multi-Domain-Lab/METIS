import { v4 as generateHash } from 'uuid'
import Mission, { TMission } from '..'
import { TCreateJsonType, TMetisBaseComponents } from '../../'
import MissionComponent, { TMissionComponentDefect } from '../component'
import { TEffect, TEffectJson } from '../effects'
import { TForce } from '../forces'
import { TNode, TNodeJsonOptions } from '../nodes'

/**
 * An action that can be executed on a mission node, causing a certain effect.
 */
export default abstract class MissionAction<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MissionComponent<T, MissionAction<T>> {
  // Implemented
  public get mission(): TMission<T> {
    return this.node.mission
  }

  /**
   * The node on which the action is being executed.
   */
  public node: TNode<T>

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [this.mission, this.force, this.node, this]
  }

  // Implemented
  public get defects(): TMissionComponentDefect[] {
    return MissionComponent.consolidateDefects(...this.effects)
  }

  /**
   * The description of the action.
   */
  public description: string

  /**
   * Text sent to the output panel after the action is
   * executed successfully.
   */
  public postExecutionSuccessText: string

  /**
   * Text sent to the output panel after the action is
   * executed unsuccessfully
   */
  public postExecutionFailureText: string

  /**
   * A key for the action, used to identify it within the node.
   */
  public localKey: string

  /**
   * The effects that can be applied to the targets.
   */
  public effects: TEffect<T>[]

  /**
   * The amount of time it takes to execute the action.
   */
  protected _processTime: number
  /**
   * The amount of time it takes to execute the action.
   */
  public get processTime(): number {
    // Return the process time within the correct range.
    // ***Note: This ensures the process time is never less than 0 or greater than 1 hour.
    return Math.min(
      Math.max(
        this._processTime + this._processTimeOperand,
        MissionAction.PROCESS_TIME_MIN,
      ),
      MissionAction.PROCESS_TIME_MAX,
    )
  }
  public set processTime(value: number) {
    this._processTime = value
  }

  /**
   * Hides the process time from students.
   * @default false
   */
  public processTimeHidden: boolean

  /**
   * The chance that the action will succeed.
   */
  protected _successChance: number
  /**
   * The chance that the action will succeed.
   */
  public get successChance(): number {
    // Return the success chance within the correct range.
    // ***Note: This ensures the success chance is never less than 0 or greater than 1.
    return Math.min(
      Math.max(
        this._successChance + this._successChanceOperand,
        MissionAction.SUCCESS_CHANCE_MIN,
      ),
      MissionAction.SUCCESS_CHANCE_MAX,
    )
  }
  public set successChance(value: number) {
    this._successChance = value
  }

  /**
   * Hides the success chance from students.
   * @default false
   */
  public successChanceHidden: boolean

  /**
   * The amount of resources the action will be subtracted
   * from that available to the executor of the action.
   */
  protected _resourceCost: number
  /**
   * The amount of resources the action will be subtracted
   * from that available to the executor of the action.
   */
  public get resourceCost(): number {
    // Return the resource cost within the correct range.
    // ***Note: This ensures the resource cost is never less than 0.
    return Math.max(
      this._resourceCost + this._resourceCostOperand,
      MissionAction.RESOURCE_COST_MIN,
    )
  }
  public set resourceCost(value: number) {
    this._resourceCost = value
  }

  /**
   * Hides the resource cost from students.
   * @default false
   */
  public resourceCostHidden: boolean

  /**
   * Whether the successful completion of this action will
   * result in the node being opened, assuming it has not
   * been opened already.
   * @default true
   */
  public opensNode: boolean

  /**
   * Hides the `opensNode` property from students.
   * @default false
   */
  public opensNodeHidden: boolean

  /**
   * The chance that the action will fail (1 - successChance).
   */
  public get failureChance(): number {
    return 1 - this.successChance
  }

  /**
   * Whether or not this action is currently being executed
   */
  public get executing(): boolean {
    let { latestExecution } = this.node

    // Check latest execution on the node, if
    // it exists, confirm that it isn't referencing
    // another action and that it is currently
    // executing.
    return (
      !!latestExecution &&
      latestExecution.action._id === this._id &&
      latestExecution.status === 'executing'
    )
  }

  /**
   * The force of which the action is a part.
   */
  public get force(): TForce<T> {
    return this.node.force
  }

  /**
   * The ID of the force of which the action is
   * a part.
   */
  public get forceId(): string {
    return this.force._id
  }

  /**
   * Used to modify the amount of time it takes to execute the action.
   * @note The operand can be positive or negative. It will either increase or decrease the process time.
   */
  private _processTimeOperand: number
  /**
   * Used to modify the chance that the action will succeed.
   * @note The operand can be positive or negative. It will either increase or decrease the success chance.
   */
  private _successChanceOperand: number
  /**
   * Used to modify the amount of resources the action costs to execute.
   * @note The operand can be positive or negative. It will either increase or decrease the resource cost.
   */
  private _resourceCostOperand: number

  /**
   * Whether the associated force has enough resources
   * remaining to perform the action, given the resource
   * cost.
   * @note This does not take into account any session
   * configuration or any cheats that may be applied.
   */
  public get areEnoughResources(): boolean {
    return (
      this.resourceCost <= Math.max(this.force.resourcesRemaining, 0) ||
      this.force.allowNegativeResources
    )
  }

  /**
   * @param node The node on which the action is being executed.
   * @param data The action data from which to create the action. Any ommitted values will be set to the default properties defined in MissionAction.DEFAULT_PROPERTIES.
   */
  public constructor(
    node: TNode<T>,
    data: Partial<TMissionActionJson> = MissionAction.DEFAULT_PROPERTIES,
  ) {
    super(
      data._id ?? MissionAction.DEFAULT_PROPERTIES._id,
      data.name ?? MissionAction.DEFAULT_PROPERTIES.name,
      false,
    )

    this.node = node
    this.description =
      data.description ?? MissionAction.DEFAULT_PROPERTIES.description
    this._processTime =
      data.processTime ?? MissionAction.DEFAULT_PROPERTIES.processTime
    this.processTimeHidden =
      data.processTimeHidden ??
      MissionAction.DEFAULT_PROPERTIES.processTimeHidden
    this._successChance =
      data.successChance ?? MissionAction.DEFAULT_PROPERTIES.successChance
    this.successChanceHidden =
      data.successChanceHidden ??
      MissionAction.DEFAULT_PROPERTIES.successChanceHidden
    this._resourceCost =
      data.resourceCost ?? MissionAction.DEFAULT_PROPERTIES.resourceCost
    this.resourceCostHidden =
      data.resourceCostHidden ??
      MissionAction.DEFAULT_PROPERTIES.resourceCostHidden
    this.opensNode =
      data.opensNode ?? MissionAction.DEFAULT_PROPERTIES.opensNode
    this.opensNodeHidden =
      data.opensNodeHidden ?? MissionAction.DEFAULT_PROPERTIES.opensNodeHidden
    this.postExecutionSuccessText =
      data.postExecutionSuccessText ??
      MissionAction.DEFAULT_PROPERTIES.postExecutionSuccessText
    this.postExecutionFailureText =
      data.postExecutionFailureText ??
      MissionAction.DEFAULT_PROPERTIES.postExecutionFailureText
    this.localKey = data.localKey ?? node.generateActionKey()
    this.effects = this.parseEffects(
      data.effects ?? MissionAction.DEFAULT_PROPERTIES.effects,
    )

    this._processTimeOperand = 0
    this._successChanceOperand = 0
    this._resourceCostOperand = 0
  }

  /**
   * Parses the effect data into Effect Objects.
   * @param data The effect data to parse.
   * @param options The options for parsing the effect data.
   * @returns An array of Effect Objects.
   */
  protected abstract parseEffects(data: TEffectJson[]): TEffect<T>[]

  /**
   * Converts the action to JSON.
   * @param options The options for converting the action to JSON.
   * @returns The JSON for the action.
   */
  public toJson(options: TActionJsonOptions = {}): TMissionActionJson {
    const { sessionDataExposure = Mission.DEFAULT_SESSION_DATA_EXPOSURE } =
      options

    let json: TMissionActionJson = {
      _id: this._id,
      name: this.name,
      description: this.description,
      processTime: this._processTime,
      processTimeHidden: this.processTimeHidden,
      successChance: this._successChance,
      successChanceHidden: this.successChanceHidden,
      resourceCost: this._resourceCost,
      resourceCostHidden: this.resourceCostHidden,
      opensNode: this.opensNode,
      opensNodeHidden: this.opensNodeHidden,
      postExecutionSuccessText: this.postExecutionSuccessText,
      postExecutionFailureText: this.postExecutionFailureText,
      localKey: this.localKey,
      effects: this.effects.map((effect) => effect.toJson()),
    }

    switch (sessionDataExposure.expose) {
      case 'all':
      case 'user-specific':
        // Obfuscate any hidden properties within the exported JSON,
        // preventing the students from seeing them.
        if (json.processTimeHidden) json.processTime = -1
        if (json.successChanceHidden) json.successChance = -1
        if (json.resourceCostHidden) json.resourceCost = -1
        if (json.opensNodeHidden) json.opensNode = false
        break
      case 'none':
      default:
        break
    }

    return json
  }

  /**
   * Modifies the amount of time it takes to execute the action.
   * @param processTimeOperand The operand to modify the process time by.
   */
  public modifyProcessTime(processTimeOperand: number): void {
    this._processTime = this.processTime
    this._processTimeOperand = processTimeOperand
  }

  /**
   * Modifies the chance that the action will succeed.
   * @param successChanceOperand The operand to modify the success
   * chance by.
   */
  public modifySuccessChance(successChanceOperand: number): void {
    this._successChance = this.successChance
    this._successChanceOperand = successChanceOperand
  }

  /**
   * Modifies the amount of resources the action costs to execute.
   * @param resourceCostOperand The operand to modify the resource
   * cost by.
   */
  public modifyResourceCost(resourceCostOperand: number): void {
    this._resourceCost = this.resourceCost
    this._resourceCostOperand = resourceCostOperand
  }

  /**
   * Generates a new key for an effect.
   * @returns The new key for an effect.
   */
  public generateEffectKey(): string {
    // Initialize
    let newKey: number = 0

    for (let effect of this.effects) {
      let effectKey: number = Number(effect.localKey)
      // If the effect has a key, and it is greater than the current
      // new key, set the new key to the effect's key.
      if (effectKey > newKey) newKey = Math.max(newKey, effectKey)
    }

    // Increment the new key by 1 and return it as a string.
    newKey++
    return String(newKey)
  }

  /**
   * The minimum process time for an action in milliseconds.
   * @note This is set to 0 milliseconds.
   */
  public static readonly PROCESS_TIME_MIN: number = 0 /*ms*/
  /**
   * The maximum process time for an action in hours.
   * @note This is set to 1 hour.
   */
  public static readonly PROCESS_TIME_MAX_HOURS: number = 1 /*hour*/
  /**
   * The maximum process time hours converted to milliseconds.
   * @note The maximum process time hour(s) is set to 1 hour,
   * which is 3,600,000 milliseconds.
   */
  private static readonly PROCESS_TIME_MAX_HOURS_CONVERTED: number =
    this.PROCESS_TIME_MAX_HOURS * 3600 * 1000 /*ms*/
  /**
   * The maximum process time for an action in minutes.
   * @note This is set to 59 minutes.
   */
  public static readonly PROCESS_TIME_MAX_MINUTES: number = 59 /*min*/
  /**
   * The maximum process time minutes converted to milliseconds.
   * @note The maximum process time minute(s) is set to 59 minutes,
   * which is 3,540,000 milliseconds.
   */
  private static readonly PROCESS_TIME_MAX_MINUTES_CONVERTED: number =
    this.PROCESS_TIME_MAX_MINUTES * 60 * 1000 /*ms*/
  /**
   * The maximum process time for an action in seconds.
   * @note This is set to 59 seconds.
   */
  public static readonly PROCESS_TIME_MAX_SECONDS: number = 59 /*sec*/
  /**
   * The maximum process time seconds converted to milliseconds.
   * @note The maximum process time second(s) is set to 59 seconds,
   * which is 59,000 milliseconds.
   */
  private static readonly PROCESS_TIME_MAX_SECONDS_CONVERTED: number =
    this.PROCESS_TIME_MAX_SECONDS * 1000 /*ms*/
  /**
   * The maximum process time for an action in milliseconds.
   * @note This is set to 1 hour 59 minutes 59 seconds (1:59:59) or 7,199,000 milliseconds.
   */
  public static readonly PROCESS_TIME_MAX: number =
    this.PROCESS_TIME_MAX_HOURS_CONVERTED +
    this.PROCESS_TIME_MAX_MINUTES_CONVERTED +
    this.PROCESS_TIME_MAX_SECONDS_CONVERTED

  /**
   * The minimum success chance for an action in decimal form.
   * @note This is set to 0.
   */
  public static readonly SUCCESS_CHANCE_MIN: number = 0
  /**
   * The maximum success chance for an action in decimal form.
   * @note This is set to 1.
   */
  public static readonly SUCCESS_CHANCE_MAX: number = 1

  /**
   * The minimum resource cost for an action.
   * @note This is set to 0.
   */
  public static readonly RESOURCE_COST_MIN: number = 0

  /**
   * The maximum length allowed for an action's name.
   */
  public static readonly MAX_NAME_LENGTH: number = 175

  /**
   * Default properties set when creating a new MissionAction object.
   */
  public static get DEFAULT_PROPERTIES(): TMissionActionDefaultJson {
    return {
      _id: generateHash(),
      name: 'New Action',
      description: '',
      processTime: 5000,
      processTimeHidden: false,
      successChance: 0.5,
      successChanceHidden: false,
      resourceCost: 1,
      resourceCostHidden: false,
      opensNode: true,
      opensNodeHidden: false,
      postExecutionSuccessText:
        '<p>Enter your successful post-execution message here.</p>',
      postExecutionFailureText:
        '<p>Enter your unsuccessful post-execution message here.</p>',
      effects: [],
    }
  }

  /**
   * Converts the process time from hours, minutes, seconds, and milliseconds
   * to milliseconds.
   * @param hours The number of hours.
   * @param minutes The number of minutes.
   * @param seconds The number of seconds.
   * @param milliseconds The number of milliseconds.
   * @returns The process time in milliseconds.
   * @note This is used to convert the process time from the
   * user-friendly format to the format used by the server.
   */
  public static convertProcessTime(
    hours: number = 0,
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0,
  ): number {
    // Ensure the values are non-negative integers.
    hours = Math.max(this.PROCESS_TIME_MIN, Math.floor(hours))
    minutes = Math.max(this.PROCESS_TIME_MIN, Math.floor(minutes))
    seconds = Math.max(this.PROCESS_TIME_MIN, Math.floor(seconds))
    milliseconds = Math.max(this.PROCESS_TIME_MIN, Math.floor(milliseconds))
    // Ensure the values are within the allowed ranges.
    hours = Math.max(this.PROCESS_TIME_MIN, hours) * 3600 * 1000
    minutes = Math.max(this.PROCESS_TIME_MIN, minutes) * 60 * 1000
    seconds = Math.max(this.PROCESS_TIME_MIN, seconds) * 1000

    // Convert the time to milliseconds.
    return hours + minutes + seconds + milliseconds
  }
}

/* ------------------------------ ACTION TYPES ------------------------------ */

/**
 * Options for converting a `MissionAction` to JSON.
 */
export type TActionJsonOptions = TNodeJsonOptions

/**
 * Extracts the action type from a registry of
 * METIS components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The action type.
 */
export type TAction<T extends TMetisBaseComponents> = T['action']

/**
 * Extracts all the properties of a `MissionAction` that are
 * needed for the JSON representation of the action.
 */
const JSON_PROPERTIES_RAW = {
  direct: [
    '_id',
    'name',
    'description',
    'processTime',
    'processTimeHidden',
    'successChance',
    'successChanceHidden',
    'resourceCost',
    'resourceCostHidden',
    'opensNode',
    'opensNodeHidden',
    'postExecutionSuccessText',
    'postExecutionFailureText',
    'localKey',
  ],
  indirect: [
    {
      /**
       * The effects that can be applied to the targets.
       */
      effects: [] as TEffectJson[],
    },
  ],
} as const

/**
 * All of the property types of a `MissionAction` that are
 * converted directly for the JSON representation of the action.
 * @note The types for each property are the same as the types
 * used in the `MissionAction` class.
 */
export type TMissionActionJsonDirect =
  (typeof JSON_PROPERTIES_RAW)['direct'][number]
/**
 * All of the property types of a `MissionAction` that are
 * converted indirectly for the JSON representation of the action.
 * @note The types for each property have been converted to a
 * different type than the types used for those properties in the
 * `MissionAction` class.
 */
export type TMissionActionJsonIndirect =
  (typeof JSON_PROPERTIES_RAW)['indirect'][number]

/**
 * Plain JSON representation of a `MissionAction` object.
 */
export type TMissionActionJson = TCreateJsonType<
  MissionAction,
  TMissionActionJsonDirect,
  TMissionActionJsonIndirect
>

/**
 * The default properties for a `MissionAction` object.
 * @inheritdoc TMissionActionJson
 */
type TMissionActionDefaultJson = Required<Omit<TMissionActionJson, 'localKey'>>
