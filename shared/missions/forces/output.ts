import { TCommonUser } from 'metis/users'
import { TForce } from '.'
import { TCommonMissionTypes, TMission } from '..'
import { TAction } from '../actions'
import { TNode } from '../nodes'

/**
 * The base properties for an output.
 */
type TBaseOutput<T extends TCommonMissionTypes = TCommonMissionTypes> = {
  /**
   * The output's ID.
   */
  _id: string
  /**
   * The ID of the force where the output panel belongs.
   */
  forceId: TForce<T>['_id']
  /**
   * The time the output was sent.
   */
  time: number
}

/**
 * The properties needed to display the intro message for a mission in the output panel.
 */
export type TIntro<T extends TCommonMissionTypes = TCommonMissionTypes> =
  TBaseOutput<T> & {
    /**
     * The type of output.
     */
    type: 'intro-message'
    /**
     * The mission's intro message.
     */
    introMessage: TMission<T>['introMessage']
    /**
     * The time the message was sent.
     */
    time: number
  }

/**
 * The properties needed to display a message in the output panel for a node that has not had any actions executed on it yet.
 */
export type TPreExecution<
  TMission extends TCommonMissionTypes = TCommonMissionTypes,
  TUser extends TCommonUser = TCommonUser,
> = TBaseOutput<TMission> & {
  /**
   * The type of output.
   */
  type: 'pre-execution'
  /**
   * The username of the user who is the source of the output.
   */
  username: TUser['username']
  /**
   * The name of the node.
   */
  nodeName: TNode<TMission>['name']
  /**
   * The pre-execution message to display in the output panel.
   */
  preExecutionMessage: TNode<TMission>['preExecutionText']
}

/**
 * The properties needed to display a message in the output panel when an action has started executing.
 */
export type TExecutionStarted<
  TMission extends TCommonMissionTypes = TCommonMissionTypes,
  TUser extends TCommonUser = TCommonUser,
> = TBaseOutput<TMission> & {
  /**
   * The type of output.
   */
  type: 'execution-started'
  /**
   * The username of the user who is the source of the message.
   */
  username: TUser['username']
  /**
   * The ID of the node that the action is being executed on.
   */
  nodeId: TNode<TMission>['_id']
  /**
   * The name of the node that the action is being executed on.
   */
  nodeName: TNode<TMission>['name']
  /**
   * The name of the action that is being executed.
   */
  actionName: TAction<TMission>['name']
  /**
   * The time it will take to execute the action.
   */
  processTime: TAction<TMission>['processTime']
  /**
   * The chance of success for the action.
   */
  successChance: TAction<TMission>['successChance']
  /**
   * The cost of resources to execute the action.
   */
  resourceCost: TAction<TMission>['resourceCost']
}

/**
 * The properties needed to display a message in the output panel when an action has been executed successfully.
 */
export type TExecutionSucceeded<
  TMission extends TCommonMissionTypes = TCommonMissionTypes,
  TUser extends TCommonUser = TCommonUser,
> = TBaseOutput<TMission> & {
  /**
   * The type of output.
   */
  type: 'execution-succeeded'
  /**
   * The username of the user who is the source of the message.
   */
  username: TUser['username']
  /**
   * The name of the node that the action is being executed on.
   */
  nodeName: TNode<TMission>['name']
  /**
   * The message to display in the output panel when the action has been executed successfully.
   */
  postExecutionSuccessMessage: TAction<TMission>['postExecutionSuccessText']
}

/**
 * The properties needed to display a message in the output panel when an action has been executed unsuccessfully.
 */
export type TExecutionFailed<
  TMission extends TCommonMissionTypes = TCommonMissionTypes,
  TUser extends TCommonUser = TCommonUser,
> = TBaseOutput<TMission> & {
  /**
   * The type of output.
   */
  type: 'execution-failed'
  /**
   * The username of the user who is the source of the message.
   */
  username: TUser['username']
  /**
   * The name of the node that the action is being executed on.
   */
  nodeName: TNode<TMission>['name']
  /**
   * The message to display in the output panel when the action has been executed unsuccessfully.
   */
  postExecutionFailureMessage: TAction<TMission>['postExecutionFailureText']
}

/**
 * The properties needed to display a custom message in the output panel.
 */
export type TCustom<
  TMission extends TCommonMissionTypes = TCommonMissionTypes,
  TUser extends TCommonUser = TCommonUser,
> = TBaseOutput<TMission> & {
  /**
   * The type of output.
   */
  type: 'custom'
  /**
   * The username of the user who is the source of the message.
   */
  username: TUser['username']
  /**
   * The message to display in the output panel.
   */
  message: string
}

/**
 * Represents an output for a force's output panel.
 */
export type TCommonOutput<
  TMission extends TCommonMissionTypes = TCommonMissionTypes,
  TUser extends TCommonUser = TCommonUser,
> =
  | TIntro<TMission>
  | TPreExecution<TMission, TUser>
  | TExecutionStarted<TMission, TUser>
  | TExecutionSucceeded<TMission, TUser>
  | TExecutionFailed<TMission, TUser>
  | TCustom<TMission, TUser>

/**
 * Extracts the output type from the mission types.
 * @param T The mission types.
 * @returns The output's type.
 */
export type TOutput<T extends TCommonMissionTypes> = T['output']
