import { TCommonUser, TCommonUserJson } from 'metis/users'
import { TBaseOutput, TBaseOutputJson } from '.'
import { TCommonMissionTypes } from '../..'
import { TCommonMissionAction, TCommonMissionActionJson } from '../../actions'
import { TActionExecutionJson, TExecution } from '../../actions/executions'
import { TCommonMissionNode, TCommonMissionNodeJson } from '../../nodes'

/**
 * The properties needed to display a message in the output panel when an action has started executing.
 */
export type TExecutionStarted<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> = TBaseOutput & {
  /**
   * The type of output.
   */
  type: 'execution-started'
  /**
   * The username of the user who is the source of the message.
   */
  username: TCommonUser['username']
  /**
   * The ID of the node that the action is being executed on.
   */
  nodeId: TCommonMissionNode['_id']
  /**
   * The name of the node that the action is being executed on.
   */
  nodeName: TCommonMissionNode['name']
  /**
   * The name of the action that is being executed.
   */
  actionName: TCommonMissionAction['name']
  /**
   * The time it will take to execute the action.
   */
  processTime: TCommonMissionAction['processTime']
  /**
   * The chance of success for the action.
   */
  successChance: TCommonMissionAction['successChance']
  /**
   * The cost of resources to execute the action.
   */
  resourceCost: TCommonMissionAction['resourceCost']
  /**
   * The current execution in process on the node by an action.
   */
  execution: TExecution<T> | null
}

/**
 * Plain JSON representation of an execution started output.
 */
export type TExecutionStartedJson = TBaseOutputJson & {
  /**
   * The type of output.
   */
  type: 'execution-started'
  /**
   * The username of the user who is the source of the message.
   */
  username: TCommonUserJson['username']
  /**
   * The ID of the node that the action is being executed on.
   */
  nodeId: TCommonMissionNodeJson['_id']
  /**
   * The name of the node that the action is being executed on.
   */
  nodeName: TCommonMissionNodeJson['name']
  /**
   * The name of the action that is being executed.
   */
  actionName: TCommonMissionActionJson['name']
  /**
   * The time it will take to execute the action.
   */
  processTime: TCommonMissionActionJson['processTime']
  /**
   * The chance of success for the action.
   */
  successChance: TCommonMissionActionJson['successChance']
  /**
   * The cost of resources to execute the action.
   */
  resourceCost: TCommonMissionActionJson['resourceCost']
  /**
   * The current execution in process on the node by an action.
   */
  execution: TActionExecutionJson
}
