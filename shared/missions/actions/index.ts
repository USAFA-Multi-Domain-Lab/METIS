import { v4 as generateHash } from 'uuid'
import {
  TCommonMission,
  TCommonMissionType,
  TCommonMissionTypes,
  TCreateMissionJsonType,
  TMission,
} from '..'
import {
  TCommonEffect,
  TCommonEffectJson,
  TEffect,
  TEffectOptions,
} from '../effects'
import { TCommonMissionForce, TForce } from '../forces'
import { TCommonMissionNode, TNode } from '../nodes'

/**
 * An action that can be executed on a mission node, causing a certain effect.
 */
export default abstract class MissionAction<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonMissionAction
{
  // Implemented
  public node: TNode<T>

  // Implemented
  public _id: TCommonMissionAction['_id']

  // Implemented
  public name: TCommonMissionAction['name']

  // Implemented
  public description: TCommonMissionAction['description']

  // Implemented
  public postExecutionSuccessText: TCommonMissionAction['postExecutionSuccessText']

  // Implemented
  public postExecutionFailureText: TCommonMissionAction['postExecutionFailureText']

  // Implemented
  public effects: TEffect<T>[]

  /**
   * The amount of time it takes to execute the action.
   */
  protected _processTime: TCommonMissionAction['processTime']
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

  // Implemented
  public processTimeHidden: TCommonMissionAction['processTimeHidden']

  /**
   * The chance that the action will succeed.
   */
  protected _successChance: TCommonMissionAction['successChance']
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

  // Implemented
  public successChanceHidden: TCommonMissionAction['successChanceHidden']

  /**
   * The amount of resources the action will be subtracted from that available to the executor of the action.
   */
  protected _resourceCost: TCommonMissionAction['resourceCost']
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

  // Implemented
  public resourceCostHidden: TCommonMissionAction['resourceCostHidden']

  // Implemented
  public opensNode: TCommonMissionAction['opensNode']

  // Implemented
  public opensNodeHidden: TCommonMissionAction['opensNodeHidden']

  // Implemented
  public get failureChance(): TCommonMissionAction['failureChance'] {
    return 1 - this.successChance
  }

  // Implemented
  public get executing(): TCommonMissionAction['executing'] {
    return this.node.executionState === 'executing'
  }

  // Implemented
  public get mission(): TMission<T> {
    return this.node.mission as TMission<T>
  }

  // Implemented
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

  // Implemented
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
    data: Partial<TCommonMissionActionJson> = MissionAction.DEFAULT_PROPERTIES,
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
    data: TCommonEffectJson[],
    options?: TEffectOptions,
  ): TEffect<T>[]

  // Implemented
  public toJson(
    options: TMissionActionJsonOptions = {},
  ): TCommonMissionActionJson {
    let json: TCommonMissionActionJson = {
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

    return json
  }

  // Implemented
  public modifyProcessTime(processTimeOperand: number): void {
    this._processTime = this.processTime
    this.processTimeOperand = processTimeOperand
  }

  // Implemented
  public modifySuccessChance(successChanceOperand: number): void {
    this._successChance = this.successChance
    this.successChanceOperand = successChanceOperand
  }

  // Implemented
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
  public static get DEFAULT_PROPERTIES(): Required<TCommonMissionActionJson> {
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
 * Options for converting a MissionAction to JSON.
 */
export type TMissionActionJsonOptions = {}

/**
 * Interface of the abstract MissionAction class.
 * @note Any public, non-static properties and functions of the MissionAction class
 * must first be defined here for them to be accessible to the Mission and
 * MissionNode classes.
 */
export interface TCommonMissionAction {
  /**
   * The node on which the action is being executed.
   */
  node: TCommonMissionNode
  /**
   * The ID of the action.
   */
  _id: string
  /**
   * The name of the action.
   */
  name: string
  /**
   * The description of the action.
   */
  description: string
  /**
   * The amount of time it takes to execute the action.
   */
  processTime: number
  /**
   * Hides the process time from students.
   * @default false
   */
  processTimeHidden: boolean
  /**
   * The chance that the action will succeed.
   */
  successChance: number
  /**
   * Hides the success chance from students.
   * @default false
   */
  successChanceHidden: boolean
  /**
   * The amount of resources the action will be subtracted from that available to the executor of the action.
   */
  resourceCost: number
  /**
   * Hides the resource cost from students.
   * @default false
   */
  resourceCostHidden: boolean
  /**
   * Whether the successful completion of this action will
   * result in the node being opened, assuming it has not
   * been opened already.
   * @default true
   */
  opensNode: boolean
  /**
   * Hides the `opensNode` property from students.
   * @default false
   */
  opensNodeHidden: boolean
  /**
   * Text sent to the output panel after the action is executed successfully.
   */
  postExecutionSuccessText: string
  /**
   * Text sent to the output panel after the action is executed unsuccessfully.
   */
  postExecutionFailureText: string
  /**
   * The effects that can be applied to the targets.
   */
  effects: TCommonEffect[]
  /**
   * The chance that the action will fail (1 - successChance).
   */
  failureChance: number
  /**
   * Whether or not this action is currently being executed.
   */
  executing: boolean
  /**
   * Whether the associated force has enough resources
   * remaining to perform the action, given the resource
   * cost.
   * @note This does not take into account any session
   * configuration or any cheats that may be applied.
   */
  get areEnoughResources(): boolean
  /**
   * The mission of which the action is a part.
   */
  mission: TCommonMission
  /**
   * The force of which the action is a part.
   */
  force: TCommonMissionForce
  /**
   * Converts the action to JSON.
   * @returns the JSON for the action.
   */
  toJson: (options?: TMissionActionJsonOptions) => TCommonMissionActionJson
  /**
   * Modifies the amount of time it takes to execute the action.
   * @param processTimeOperand The operand to modify the process time by.
   */
  modifyProcessTime: (processTimeOperand: number) => void
  /**
   * Modifies the chance that the action will succeed.
   * @param successChanceOperand The operand to modify the success chance by.
   */
  modifySuccessChance: (successChanceOperand: number) => void
  /**
   * Modifies the amount of resources the action costs to execute.
   * @param resourceCostOperand The operand to modify the resource cost by.
   */
  modifyResourceCost: (resourceCostOperand: number) => void
}

/**
 * Extracts the action type from the mission types.
 * @param T The mission types.
 * @returns The action type.
 */
export type TAction<T extends TCommonMissionTypes> = T['action']

/**
 * Plain JSON representation of a MissionAction object.
 */
export type TCommonMissionActionJson = TCreateMissionJsonType<
  TCommonMissionAction,
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
  { effects: TCommonEffectJson[] }
>
