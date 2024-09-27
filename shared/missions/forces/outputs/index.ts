import { TCommonMissionTypes } from 'metis/missions'
import {
  TAction,
  TCommonMissionAction,
  TCommonMissionActionJson,
} from 'metis/missions/actions'
import IActionExecution, {
  TActionExecutionJson,
  TExecution,
} from 'metis/missions/actions/executions'
import {
  TCommonMissionNode,
  TCommonMissionNodeJson,
  TNode,
} from 'metis/missions/nodes'
import { TCommonMissionForce, TCommonMissionForceJson, TForce } from '..'
import StringToolbox from '../../../toolbox/strings'

/**
 * An output that's displayed in a force's output panel.
 */
export default abstract class Output<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonOutput
{
  // Implemented
  public readonly _id: TCommonOutput['_id']
  // Implemented
  public readonly key: TCommonOutput['key']
  // Implemented
  public readonly forceId: TForce<T>['_id']
  // Implemented
  public readonly nodeId: TNode<T>['_id'] | null
  // Implemented
  public readonly actionId: TAction<T>['_id'] | null
  // Implemented
  public readonly prefix: TCommonOutput['prefix']
  // Implemented
  public readonly message: TCommonOutput['message']
  // Implemented
  public readonly time: TCommonOutput['time']
  // Implemented
  public readonly timeStamp: TCommonOutput['timeStamp']
  /**
   * The current execution in process on the node by an action.
   */
  protected _execution: TExecution<T> | null
  /**
   * The current execution in process on the node by an action.
   */
  public get execution(): TExecution<T> | null {
    return this._execution
  }

  /**
   * @param data The output data from which to create the output.
   */
  public constructor(
    data: Partial<TCommonOutputJson> = Output.DEFAULT_PROPERTIES,
    options: TOutputOptions = {},
  ) {
    this._id = data._id ?? Output.DEFAULT_PROPERTIES._id
    this.key = data.key ?? Output.DEFAULT_PROPERTIES.key
    this.forceId = data.forceId ?? Output.DEFAULT_PROPERTIES.forceId
    this.nodeId = data.nodeId ?? Output.DEFAULT_PROPERTIES.nodeId
    this.actionId = data.actionId ?? Output.DEFAULT_PROPERTIES.actionId
    this.prefix = data.prefix ?? Output.DEFAULT_PROPERTIES.prefix
    this.message = data.message ?? Output.DEFAULT_PROPERTIES.message
    this.time = data.time ?? Output.DEFAULT_PROPERTIES.time
    this.timeStamp = data.timeStamp ?? Output.DEFAULT_PROPERTIES.timeStamp
    this._execution = null
  }

  // Implemented
  public toJson(): TCommonOutputJson {
    return {
      _id: this._id,
      key: this.key,
      forceId: this.forceId,
      nodeId: this.nodeId,
      actionId: this.actionId,
      prefix: this.prefix,
      message: this.message,
      time: this.time,
      timeStamp: this.timeStamp,
      execution: this.execution ? this.execution.toJson() : null,
    }
  }

  /**
   * The default properties for an output.
   */
  public static get DEFAULT_PROPERTIES(): TCommonOutputJson {
    return {
      _id: StringToolbox.generateRandomId(),
      key: 'custom',
      forceId: '',
      nodeId: null,
      actionId: null,
      prefix: '',
      message: '',
      time: Date.now(),
      timeStamp: Output.FORMAT_TIME(Date.now()),
      execution: null,
    }
  }

  /**
   * Formats the time.
   * @param time The time to format.
   * @returns The formatted time as a string.
   */
  public static FORMAT_TIME(time: number): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(time)
  }
}

/**
 * The key used to identify the output type.
 */
type TOutputKey =
  | 'custom'
  | 'intro'
  | 'execution-failed'
  | 'execution-started'
  | 'execution-succeeded'
  | 'pre-execution'

/**
 * Options used to create an `Output`.
 */
export type TOutputOptions = {}

/**
 * Represents an output for a force's output panel.
 */
export type TCommonOutput = {
  /**
   * The output's ID.
   */
  _id: string
  /**
   * The key used to identify the output type.
   */
  key: TOutputKey
  /**
   * The ID of the force where the output panel belongs.
   */
  forceId: TCommonMissionForce['_id']
  /**
   * The ID of the node that the session member interacted with to trigger the output.
   */
  nodeId: TCommonMissionNode['_id'] | null
  /**
   * The ID of the action that's being executed.
   */
  actionId: TCommonMissionAction['_id'] | null
  /**
   * The prefix displayed before the output message.
   */
  prefix: string
  /**
   * The message to display in the output panel.
   */
  message: string
  /**
   * The time the output was sent.
   */
  time: number
  /**
   * The formatted time the output was sent.
   */
  timeStamp: string
  /**
   * The current execution in process on the node by an action.
   */
  get execution(): IActionExecution | null
  /**
   * Converts the output to JSON.
   */
  toJson: () => TCommonOutputJson
}

/**
 * Plain JSON representation of an output for a force's output panel.
 */
export type TCommonOutputJson = {
  /**
   * The output's ID.
   */
  _id: string
  /**
   * The key used to identify the output type.
   */
  key: TOutputKey
  /**
   * The ID of the force where the output panel belongs.
   */
  forceId: TCommonMissionForceJson['_id']
  /**
   * The ID of the node that the session member interacted with to trigger the output.
   */
  nodeId: TCommonMissionNodeJson['_id'] | null
  /**
   * The ID of the action that's being executed.
   */
  actionId: TCommonMissionActionJson['_id'] | null
  /**
   * The prefix displayed before the output message.
   */
  prefix: string
  /**
   * The message to display in the output panel.
   */
  message: string
  /**
   * The time the output was sent.
   */
  time: number
  /**
   * The formatted time the output was sent.
   */
  timeStamp: string
  /**
   * The current execution in process on the node by an action.
   */
  execution: TActionExecutionJson
}

/**
 * Extracts the output type from the mission types.
 * @param T The mission types.
 * @returns The output's type.
 */
export type TOutput<T extends TCommonMissionTypes> = T['output']
