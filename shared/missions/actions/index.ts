import { AnyObject } from 'metis/toolbox/objects'
import { v4 as generateHash } from 'uuid'
import { IMissionNode } from '../nodes'
import { IMission } from '..'

/**
 * Interface of the abstract MissionAction class.
 * @note Any public, non-static properties and functions of the MissionAction class
 * must first be defined here for them to be accessible to the Mission and
 * MissionNode classes.
 */
export interface IMissionAction {
  /**
   * The node on which the action is being executed.
   */
  node: IMissionNode
  /**
   * The mission of which the action is a part.
   */
  mission: IMission
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
   * The chance that the action will fail (1 - successChance).
   */
  failureChance: number
  /**
   * The amount of resources the action will be subtracted from that available to the executor of the action.
   */
  resourceCost: number
  /**
   * Whether or not this action is currently being executed.
   */
  executing: boolean
  /**
   * Text printed to the console after the action is executed successfully.
   */
  postExecutionSuccessText: string
  /**
   * Text printed to the console after the action is executed unsuccessfully.
   */
  postExecutionFailureText: string
  /**
   * Effects that are performed when the action is executed successfully.
   */
  scripts: Array<IScript>
  /**
   * Converts the action to JSON.
   * @returns {IMissionActionJSON} the JSON for the action.
   */
  toJSON: () => IMissionActionJSON
}

export interface IScript {
  label: string
  description: string
  scriptName: string
  originalPath: string
  args: AnyObject
}

/**
 * Plain JSON representation of a MissionAction object.
 */
export interface IMissionActionJSON {
  actionID: string
  name: string
  description: string
  processTime: number
  successChance: number
  resourceCost: number
  postExecutionSuccessText: string
  postExecutionFailureText: string
  scripts: Array<IScript>
}

/**
 * Options for creating a mission action.
 */
export interface IMissionActionOptions {}

/**
 * An action that can be executed on a mission node, causing a certain effect.
 */
export default abstract class MissionAction<
  TMission extends IMission,
  TMissionNode extends IMissionNode,
> implements IMissionAction
{
  // Inherited
  public node: TMissionNode

  // Inherited
  public actionID: string

  // Inherited
  public name: string

  // Inherited
  public description: string

  // Inherited
  public processTime: number

  // Inherited
  public successChance: number

  // Inherited
  public resourceCost: number

  // Inherited
  public postExecutionSuccessText: string

  // Inherited
  public postExecutionFailureText: string

  // Inherited
  public scripts: Array<IScript>

  // Inherited
  public get failureChance(): number {
    return 1 - this.successChance
  }

  // Inherited
  public get executing(): boolean {
    return this.node.executionState === 'executing'
  }

  // Inherited
  public get mission(): TMission {
    return this.node.mission as TMission
  }

  /**
   * @param {TMissionNode} node The node on which the action is being executed.
   * @param {IMissionActionJSON} data The action data from which to create the action. Any ommitted values will be set to the default properties defined in MissionAction.DEFAULT_PROPERTIES.
   */
  public constructor(
    node: TMissionNode,
    data: Partial<IMissionActionJSON> = MissionAction.DEFAULT_PROPERTIES,
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
    this.scripts = data.scripts ?? MissionAction.DEFAULT_PROPERTIES.scripts
  }

  // inherited
  public toJSON(): IMissionActionJSON {
    return {
      actionID: this.actionID,
      name: this.name,
      description: this.description,
      processTime: this.processTime,
      successChance: this.successChance,
      resourceCost: this.resourceCost,
      postExecutionSuccessText: this.postExecutionSuccessText,
      postExecutionFailureText: this.postExecutionFailureText,
      scripts: this.scripts,
    }
  }

  /**
   * Default properties set when creating a new MissionAction object.
   */
  public static get DEFAULT_PROPERTIES(): IMissionActionJSON {
    return {
      actionID: generateHash(),
      name: 'New Action',
      description: 'Enter your description here.',
      processTime: 5000,
      successChance: 0.5,
      resourceCost: 1,
      postExecutionSuccessText:
        'Enter your successful post-execution message here.',
      postExecutionFailureText:
        'Enter your unsuccessful post-execution message here.',
      scripts: [],
    }
  }
}
