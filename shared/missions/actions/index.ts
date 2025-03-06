import { v4 as generateHash } from 'uuid'
import Mission, {
  TCommonMissionTypes,
  TCreateMissionJsonType,
  TMission,
} from '..'
import Effect, { TEffectJson, TEffect, TEffectOptions } from '../effects'
import { MissionForce, TForce } from '../forces'
import MissionNode, { TNode, TNodeJsonOptions } from '../nodes'

/**
 * An action that can be executed on a mission node, causing a certain effect.
 */
export default abstract class MissionAction<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> {
  /**
   * The node on which the action is being executed.
   */
  public node: TNode<T>

  /**
   * The ID of the action.
   */
  public _id: string

  /**
   * The name of the action.
   */
  public name: string

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
        this._processTime + this.processTimeOperand,
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
        this._successChance + this.successChanceOperand,
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
      this._resourceCost + this.resourceCostOperand,
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
    return this.node.executionState === 'executing'
  }

  /**
   * The mission of which the action is a part.
   */
  public get mission(): TMission<T> {
    return this.node.mission as TMission<T>
  }

  /**
   * The force of which the action is a part.
   */
  public get force(): TForce<T> {
    return this.node.force
  }

  /**
   * Used to modify the amount of time it takes to execute the action.
   * @note The operand can be positive or negative. It will either increase or decrease the process time.
   */
  private processTimeOperand: number
  /**
   * Used to modify the chance that the action will succeed.
   * @note The operand can be positive or negative. It will either increase or decrease the success chance.
   */
  private successChanceOperand: number
  /**
   * Used to modify the amount of resources the action costs to execute.
   * @note The operand can be positive or negative. It will either increase or decrease the resource cost.
   */
  private resourceCostOperand: number

  /**
   * Whether the associated force has enough resources
   * remaining to perform the action, given the resource
   * cost.
   * @note This does not take into account any session
   * configuration or any cheats that may be applied.
   */
  public get areEnoughResources(): boolean {
    return this.resourceCost <= Math.max(this.force.resourcesRemaining, 0)
  }

  /**
   * @param node The node on which the action is being executed.
   * @param data The action data from which to create the action. Any ommitted values will be set to the default properties defined in MissionAction.DEFAULT_PROPERTIES.
   * @param options The options for creating the action.
   */
  public constructor(
    node: TNode<T>,
    data: Partial<TMissionActionJson> = MissionAction.DEFAULT_PROPERTIES,
    options: TMissionActionOptions = {},
  ) {
    let { populateTargets = false } = options

    this.node = node
    this._id = data._id ?? MissionAction.DEFAULT_PROPERTIES._id
    this.name = data.name ?? MissionAction.DEFAULT_PROPERTIES.name
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
    this.effects = this.parseEffects(
      data.effects ?? MissionAction.DEFAULT_PROPERTIES.effects,
      { populateTargets },
    )

    this.processTimeOperand = 0
    this.successChanceOperand = 0
    this.resourceCostOperand = 0
  }

  /**
   * Parses the effect data into Effect Objects.
   * @param data The effect data to parse.
   * @param options The options for parsing the effect data.
   * @returns An array of Effect Objects.
   */
  protected abstract parseEffects(
    data: TEffectJson[],
    options?: TEffectOptions,
  ): TEffect<T>[]

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
      processTime: this.processTime,
      processTimeHidden: this.processTimeHidden,
      successChance: this.successChance,
      successChanceHidden: this.successChanceHidden,
      resourceCost: this.resourceCost,
      resourceCostHidden: this.resourceCostHidden,
      opensNode: this.opensNode,
      opensNodeHidden: this.opensNodeHidden,
      postExecutionSuccessText: this.postExecutionSuccessText,
      postExecutionFailureText: this.postExecutionFailureText,
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
    this.processTimeOperand = processTimeOperand
  }

  /**
   * Modifies the chance that the action will succeed.
   * @param successChanceOperand The operand to modify the success
   * chance by.
   */
  public modifySuccessChance(successChanceOperand: number): void {
    this._successChance = this.successChance
    this.successChanceOperand = successChanceOperand
  }

  /**
   * Modifies the amount of resources the action costs to execute.
   * @param resourceCostOperand The operand to modify the resource
   * cost by.
   */
  public modifyResourceCost(resourceCostOperand: number): void {
    this._resourceCost = this.resourceCost
    this.resourceCostOperand = resourceCostOperand
  }

  /**
   * The minimum process time for an action in milliseconds.
   */
  public static readonly PROCESS_TIME_MIN: number = 0 /*ms*/
  /**
   * The maximum process time for an action in milliseconds.
   * @note This is set to 1 hour.
   */
  public static readonly PROCESS_TIME_MAX: number = 3600000 /*ms*/

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
  public static get DEFAULT_PROPERTIES(): Required<TMissionActionJson> {
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
}

/* ------------------------------ ACTION TYPES ------------------------------ */

/**
 * Options for creating a mission action.
 */
export type TMissionActionOptions = {
  /**
   * Whether to populate the targets.
   * @default false
   */
  populateTargets?: boolean
}

/**
 * Options for converting a `MissionAction` to JSON.
 */
export type TActionJsonOptions = TNodeJsonOptions

/**
 * Extracts the action type from the mission types.
 * @param T The mission types.
 * @returns The action type.
 */
export type TAction<T extends TCommonMissionTypes> = T['action']
/**
 * Plain JSON representation of a MissionAction object.
 */
export type TMissionActionJson = TCreateMissionJsonType<
  MissionAction,
  | '_id'
  | 'name'
  | 'description'
  | 'processTime'
  | 'processTimeHidden'
  | 'successChance'
  | 'successChanceHidden'
  | 'resourceCost'
  | 'resourceCostHidden'
  | 'opensNode'
  | 'opensNodeHidden'
  | 'postExecutionSuccessText'
  | 'postExecutionFailureText',
  { effects: TEffectJson[] }
>
