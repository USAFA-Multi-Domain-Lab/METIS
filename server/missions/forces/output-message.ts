import { TServerMissionTypes } from '..'
import {
  TCommonOutputMessage,
  TExecutionFailed,
  TExecutionStarted,
  TExecutionSucceeded,
  TIntro,
  TPreExecution,
} from '../../../shared/missions/forces/output-message'
import ServerUser from '../../users'

/**
 * The properties needed to display the intro message for a mission in the output panel.
 */
export type TServerIntro = TIntro<TServerMissionTypes>

/**
 * The properties needed to display a message in the output panel for a node that has not had any actions executed on it yet.
 */
export type TServerPreExecution = TPreExecution<TServerMissionTypes, ServerUser>

/**
 * The properties needed to display a message in the output panel when an action has started executing.
 */
export type TServerExecutionStarted = TExecutionStarted<
  TServerMissionTypes,
  ServerUser
>

/**
 * The properties needed to display a message in the output panel when an action has been executed successfully.
 */
export type TServerExecutionSucceeded = TExecutionSucceeded<
  TServerMissionTypes,
  ServerUser
>

/**
 * The properties needed to display a message in the output panel when an action has been executed unsuccessfully.
 */
export type TServerExecutionFailed = TExecutionFailed<
  TServerMissionTypes,
  ServerUser
>

/**
 * Represents an output message used on the server.
 */
export type TServerOutputMessage = TCommonOutputMessage<
  TServerMissionTypes,
  ServerUser
>
