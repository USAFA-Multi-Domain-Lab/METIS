import { v4 as generateHash } from 'uuid'
import { TCommonMission, TCommonMissionTypes, TMission } from '..'
import { uuidTypeValidator } from '../../toolbox/validators'
import { TCommonEffect, TCommonEffectJson, TEffect } from '../effects'
import { TCommonMissionForce, TForce } from '../forces'
import { TCommonMissionNode, TNode } from '../nodes'

/**
 * An action that can be executed on a mission node, causing a certain effect.
 */
export default abstract class MissionAction<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonMissionAction
{
  // Inherited
  public node: TNode<T>

  // Inherited
  public _id: TCommonMissionAction['_id']

  // Inherited
  public name: TCommonMissionAction['name']

  // Inherited
  public description: TCommonMissionAction['description']

  // Inherited
  public postExecutionSuccessText: TCommonMissionAction['postExecutionSuccessText']

  // Inherited
  public postExecutionFailureText: TCommonMissionAction['postExecutionFailureText']

  // Inherited
  public effects: TEffect<T>[]

  /**
   * The amount of time it takes to execute the action.
   */
  protected _processTime: TCommonMissionAction['processTime']
  public get processTime(): number {
    return this._processTime + this.processTimeOperand
  }
  public set processTime(value: number) {
    this._processTime = value
  }

  /**
   * The chance that the action will succeed.
   */
  protected _successChance: TCommonMissionAction['successChance']
  public get successChance(): number {
    return this._successChance + this.successChanceOperand
  }
  public set successChance(value: number) {
    this._successChance = value
  }

  /**
   * The amount of resources the action will be subtracted from that available to the executor of the action.
   */
  protected _resourceCost: TCommonMissionAction['resourceCost']
  public get resourceCost(): number {
    return this._resourceCost + this.resourceCostOperand
  }
  public set resourceCost(value: number) {
    this._resourceCost = value
  }

  // Inherited
  public get failureChance(): TCommonMissionAction['failureChance'] {
    return 1 - this.successChance
  }

  // Inherited
  public get executing(): TCommonMissionAction['executing'] {
    return this.node.executionState === 'executing'
  }

  // Inherited
  public get mission(): TMission<T> {
    return this.node.mission as TMission<T>
  }

  // Inherited
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
   * @param node The node on which the action is being executed.
   * @param data The action data from which to create the action. Any ommitted values will be set to the default properties defined in MissionAction.DEFAULT_PROPERTIES.
   */
  public constructor(
    node: TNode<T>,
    data: Partial<TCommonMissionActionJson> = MissionAction.DEFAULT_PROPERTIES,
  ) {
    this.node = node
    this._id = data._id?.toString() ?? MissionAction.DEFAULT_PROPERTIES._id
    this.name = data.name ?? MissionAction.DEFAULT_PROPERTIES.name
    this.description =
      data.description ?? MissionAction.DEFAULT_PROPERTIES.description
    this._processTime =
      data.processTime ?? MissionAction.DEFAULT_PROPERTIES.processTime
    this._successChance =
      data.successChance ?? MissionAction.DEFAULT_PROPERTIES.successChance
    this._resourceCost =
      data.resourceCost ?? MissionAction.DEFAULT_PROPERTIES.resourceCost
    this.postExecutionSuccessText =
      data.postExecutionSuccessText ??
      MissionAction.DEFAULT_PROPERTIES.postExecutionSuccessText
    this.postExecutionFailureText =
      data.postExecutionFailureText ??
      MissionAction.DEFAULT_PROPERTIES.postExecutionFailureText
    this.effects = this.parseEffects(
      data.effects ?? MissionAction.DEFAULT_PROPERTIES.effects,
    )

    this.processTimeOperand = 0
    this.successChanceOperand = 0
    this.resourceCostOperand = 0
  }

  /**
   * Parses the effect data into Effect Objects.
   * @param data The effect data to parse.
   * @returns An array of Effect Objects.
   */
  public abstract parseEffects(data: TCommonEffectJson[]): TEffect<T>[]

  // Implemented
  public toJson(): TCommonMissionActionJson {
    let json: TCommonMissionActionJson = {
      name: this.name,
      description: this.description,
      processTime: this.processTime,
      successChance: this.successChance,
      resourceCost: this.resourceCost,
      postExecutionSuccessText: this.postExecutionSuccessText,
      postExecutionFailureText: this.postExecutionFailureText,
      effects: this.effects.map((effect) => effect.toJson()),
    }

    // Include _id if it's an ObjectId.
    // * Note: IDs in the database are
    // * stored as mongoose ObjectIds.
    // * If the ID is a UUID, then the
    // * mission won't save.
    let isObjectId: boolean = !uuidTypeValidator(this._id) ? true : false
    if (isObjectId) {
      json._id = this._id
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
   * Default properties set when creating a new MissionAction object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonMissionActionJson> {
    return {
      _id: generateHash(),
      name: 'New Action',
      description: '',
      processTime: 5000,
      successChance: 0.5,
      resourceCost: 1,
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
export type TMissionActionOptions = {}

/**
 * Options for converting a MissionAction to JSON.
 */
export type TMissionActionJsonOtions = {}

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
   * The chance that the action will succeed.
   */
  successChance: number
  /**
   * The amount of resources the action will be subtracted from that available to the executor of the action.
   */
  resourceCost: number
  /**
   * Text printed to the console after the action is executed successfully.
   */
  postExecutionSuccessText: string
  /**
   * Text printed to the console after the action is executed unsuccessfully.
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
  toJson: (options?: TMissionActionJsonOtions) => TCommonMissionActionJson
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
export interface TCommonMissionActionJson {
  /**
   * The ID of the action.
   */
  _id?: string
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
   * The chance that the action will succeed.
   */
  successChance: number
  /**
   * The amount of resources the action will be subtracted from that available to the executor of the action.
   */
  resourceCost: number
  /**
   * Text printed to the console after the action is executed successfully.
   */
  postExecutionSuccessText: string
  /**
   * Text printed to the console after the action is executed unsuccessfully.
   */
  postExecutionFailureText: string
  /**
   * The effects that can be applied to the targets (JSON).
   */
  effects: TCommonEffectJson[]
}
