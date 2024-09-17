import { TCommonUser, TCommonUserJson } from 'metis/users'
import { TBaseOutput, TBaseOutputJson } from '.'
import { TCommonMissionNode, TCommonMissionNodeJson } from '../../nodes'

/**
 * The properties needed to display a message in the output panel for a node that has not had any actions executed on it yet.
 */
export type TPreExecution = TBaseOutput & {
  /**
   * The type of output.
   */
  type: 'pre-execution'
  /**
   * The username of the user who is the source of the output.
   */
  username: TCommonUser['username']
  /**
   * The name of the node.
   */
  nodeName: TCommonMissionNode['name']
  /**
   * The pre-execution message to display in the output panel.
   */
  message: TCommonMissionNode['preExecutionText']
}

/**
 * Plain JSON representation of a pre-execution output.
 */
export type TPreExecutionJson = TBaseOutputJson & {
  /**
   * The type of output.
   */
  type: 'pre-execution'
  /**
   * The username of the user who is the source of the output.
   */
  username: TCommonUserJson['username']
  /**
   * The name of the node.
   */
  nodeName: TCommonMissionNodeJson['name']
  /**
   * The pre-execution message to display in the output panel.
   */
  message: TCommonMissionNodeJson['preExecutionText']
}
