import { v4 as generateHash } from 'uuid'
import { TCommonMission } from '..'
import { TCommonEffect, TCommonEffectJson } from '../effects'
import { TCommonMissionNode } from '../nodes'

/**
 * An action that can be executed on a mission node, causing a certain effect.
 */
export default abstract class MissionAction<
  TMission extends TCommonMission,
  TMissionNode extends TCommonMissionNode,
  TEffect extends TCommonEffect,
> implements TCommonMissionAction
{
  // Inherited
  public node: TMissionNode

  // Inherited
  public actionID: TCommonMissionAction['actionID']

  // Inherited
  public name: TCommonMissionAction['name']

  // Inherited
  public description: TCommonMissionAction['description']

  // Inherited
  public processTime: TCommonMissionAction['processTime']

  // Inherited
  public successChance: TCommonMissionAction['successChance']

  // Inherited
  public resourceCost: TCommonMissionAction['resourceCost']

  // Inherited
  public postExecutionSuccessText: TCommonMissionAction['postExecutionSuccessText']

  // Inherited
  public postExecutionFailureText: TCommonMissionAction['postExecutionFailureText']

  // Inherited
  public effects: TEffect[]

  // Inherited
  public get failureChance(): TCommonMissionAction['failureChance'] {
    return 1 - this.successChance
  }

  // Inherited
  public get executing(): TCommonMissionAction['executing'] {
    return this.node.executionState === 'executing'
  }

  // Inherited
  public get mission(): TMission {
    return this.node.mission as TMission
  }

  /**
   * @param {TMissionNode} node The node on which the action is being executed.
   * @param {TCommonMissionActionJson} data The action data from which to create the action. Any ommitted values will be set to the default properties defined in MissionAction.DEFAULT_PROPERTIES.
   */
  public constructor(
    node: TMissionNode,
    data: Partial<TCommonMissionActionJson> = MissionAction.DEFAULT_PROPERTIES,
  ) {
    this.node = node
    this.actionID = data.actionID ?? MissionAction.DEFAULT_PROPERTIES.actionID
    this.name = data.name ?? MissionAction.DEFAULT_PROPERTIES.name
    this.description =
      data.description ?? MissionAction.DEFAULT_PROPERTIES.description
    this.processTime =
      data.processTime ?? MissionAction.DEFAULT_PROPERTIES.processTime
    this.successChance =
      data.successChance ?? MissionAction.DEFAULT_PROPERTIES.successChance
    this.resourceCost =
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
  }

  /**
   * Parses the effect data into Effect Objects.
   * @param data The effect data to parse.
   * @returns {TCommonMissionAction['effects']} An array of Effect Objects.
   */
  public abstract parseEffects(data: TCommonEffectJson[]): TEffect[]

  // inherited
  public toJson(): TCommonMissionActionJson {
    return {
      actionID: this.actionID,
      name: this.name,
      description: this.description,
      processTime: this.processTime,
      successChance: this.successChance,
      resourceCost: this.resourceCost,
      postExecutionSuccessText: this.postExecutionSuccessText,
      postExecutionFailureText: this.postExecutionFailureText,
      effects: this.effects.map((effect) => effect.toJson()),
    }
  }

  /**
   * Default properties set when creating a new MissionAction object.
   */
  public static get DEFAULT_PROPERTIES(): TCommonMissionActionJson {
    return {
      actionID: generateHash(),
      name: 'New Action',
      description: '<p><br></p>',
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
  actionID: string
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
   * Converts the action to JSON.
   * @returns {TCommonMissionActionJson} the JSON for the action.
   */
  toJson: (options?: TMissionActionJsonOtions) => TCommonMissionActionJson
}

/**
 * Plain JSON representation of a MissionAction object.
 */
export interface TCommonMissionActionJson {
  /**
   * The ID of the action.
   */
  actionID: string
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
