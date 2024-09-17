import {
  TCommonMissionAction,
  TCommonMissionActionJson,
} from 'metis/missions/actions'
import {
  TCommonMissionNode,
  TCommonMissionNodeJson,
} from 'metis/missions/nodes'
import { TCommonUser, TCommonUserJson } from 'metis/users'
import { TBaseOutput, TBaseOutputJson } from '.'

/**
 * The properties needed to display a message in the output panel when an action has been executed successfully.
 */
export type TExecutionSucceeded = TBaseOutput & {
  /**
   * The type of output.
   */
  type: 'execution-succeeded'
  /**
   * The username of the user who is the source of the message.
   */
  username: TCommonUser['username']
  /**
   * The name of the node that the action is being executed on.
   */
  nodeName: TCommonMissionNode['name']
  /**
   * The message to display in the output panel when the action has been executed successfully.
   */
  message: TCommonMissionAction['postExecutionSuccessText']
}

/**
 * Plain JSON representation of an execution succeeded output.
 */
export type TExecutionSucceededJson = TBaseOutputJson & {
  /**
   * The type of output.
   */
  type: 'execution-succeeded'
  /**
   * The username of the user who is the source of the message.
   */
  username: TCommonUserJson['username']
  /**
   * The name of the node that the action is being executed on.
   */
  nodeName: TCommonMissionNodeJson['name']
  /**
   * The message to display in the output panel when the action has been executed successfully.
   */
  message: TCommonMissionActionJson['postExecutionSuccessText']
}
