import { TClientMissionTypes } from '..'
import {
  TCommonOutput,
  TExecutionFailed,
  TExecutionStarted,
  TExecutionSucceeded,
  TIntro,
  TPreExecution,
} from '../../../../shared/missions/forces/output'
import ClientUser from '../../users'

/**
 * The properties needed to display the intro message for a mission in the output panel.
 */
export type TClientIntro = TIntro<TClientMissionTypes>

/**
 * The properties needed to display a message in the output panel for a node that has not had any actions executed on it yet.
 */
export type TClientPreExecution = TPreExecution<TClientMissionTypes, ClientUser>

/**
 * The properties needed to display a message in the output panel when an action has started executing.
 */
export type TClientExecutionStarted = TExecutionStarted<
  TClientMissionTypes,
  ClientUser
>

/**
 * The properties needed to display a message in the output panel when an action has been executed successfully.
 */
export type TClientExecutionSucceeded = TExecutionSucceeded<
  TClientMissionTypes,
  ClientUser
>

/**
 * The properties needed to display a message in the output panel when an action has been executed unsuccessfully.
 */
export type TClientExecutionFailed = TExecutionFailed<
  TClientMissionTypes,
  ClientUser
>

/**
 * Represents an output for a force's output panel that's used on the client.
 */
export type TClientOutput = TCommonOutput<TClientMissionTypes, ClientUser>
