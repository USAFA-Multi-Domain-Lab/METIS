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
import { TCommonMissionForce, TCommonMissionForceJson, TForce } from '.'
import StringToolbox from '../../toolbox/strings'

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
  public readonly force: TForce<T>
  // Implemented
  public readonly node: TNode<T> | null
  // Implemented
  public readonly action: TAction<T> | null
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
   * @param force The force where the output panel belongs.
   * @param data The output data from which to create the output.
   * @param options The options for creating the output.
   */
  public constructor(
    force: TForce<T>,
    data: Partial<TCommonOutputJson> = Output.DEFAULT_PROPERTIES,
    options: TOutputOptions = {},
  ) {
    this._id = data._id ?? Output.DEFAULT_PROPERTIES._id
    this.key = data.key ?? Output.DEFAULT_PROPERTIES.key
    this.prefix = data.prefix ?? Output.DEFAULT_PROPERTIES.prefix
    this.message = data.message ?? Output.DEFAULT_PROPERTIES.message
    this.time = data.time ?? Output.DEFAULT_PROPERTIES.time
    this.timeStamp = data.timeStamp ?? Output.DEFAULT_PROPERTIES.timeStamp

    this.force = force
    this.node = null
    this.action = null
    // This gets set in the constructor of the child classes (ClientOutput and ServerOutput).
    this._execution = null

    // Set the node and action if they exist.
    if (data.nodeId) {
      let node = this.force.getNode(data.nodeId)
      if (node) this.node = node

      if (data.actionId && this.node) {
        let action = this.node.actions.get(data.actionId)
        if (action) this.action = action
      }
    }
  }

  // Implemented
  public toJson(): TCommonOutputJson {
    return {
      _id: this._id,
      key: this.key,
      forceId: this.force._id,
      nodeId: this.node?._id ?? null,
      actionId: this.action?._id ?? null,
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
   * The force where the output panel belongs.
   */
  force: TCommonMissionForce
  /**
   * The node that the session member interacted with to trigger the output.
   */
  node: TCommonMissionNode | null
  /**
   * The action that's being executed.
   */
  action: TCommonMissionAction | null
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
