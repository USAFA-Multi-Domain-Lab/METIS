import Mission, { TCommonMissionTypes } from 'metis/missions'
import { TMissionActionJson } from 'metis/missions/actions'
import { TActionExecutionJson } from 'metis/missions/actions/executions'
import { TMissionNodeJson } from 'metis/missions/nodes'
import { TMissionForceSaveJson, TForce } from '.'
import StringToolbox from '../../toolbox/strings'

/**
 * An output that's displayed in a force's output panel.
 */
export default abstract class MissionOutput<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> {
  /**
   * The output's ID.
   */
  public readonly _id: string

  /**
   * Differentiates different types of outputs being used.
   */
  public readonly type: TOutputType

  /**
   * The mission where the output belongs.
   */
  public get mission(): Mission {
    return this.force.mission
  }

  /**
   * The force where the output belongs.
   */
  public readonly force: TForce<T>

  /**
   * The node that the session member
   * interacted with to trigger the output.
   */
  public readonly node: T['node'] | null

  /**
   * The action that's being executed.
   */
  public readonly action: T['action'] | null

  /**
   * The prefix displayed before the output message.
   */
  public readonly prefix: string

  /**
   * The message to display in the output panel.
   */
  public readonly message: string

  /**
   * The time the output was sent.
   */
  public readonly time: number

  /**
   * The formatted time the output was sent.
   */
  public readonly timeStamp: string

  /**
   * The current execution in process on the node by an action.
   */
  protected _execution: T['execution'] | null

  /**
   * The current execution in process on the node by an action.
   */
  public get execution(): T['execution'] | null {
    return this._execution
  }

  /**
   * @param force The force where the output panel belongs.
   * @param data The output data from which to create the output.
   * @param options The options for creating the output.
   */
  public constructor(
    force: TForce<T>,
    data: Partial<TOutputJson> = MissionOutput.DEFAULT_PROPERTIES,
  ) {
    this._id = data._id ?? MissionOutput.DEFAULT_PROPERTIES._id
    this.type = data.type ?? MissionOutput.DEFAULT_PROPERTIES.type
    this.prefix = data.prefix ?? MissionOutput.DEFAULT_PROPERTIES.prefix
    this.message = data.message ?? MissionOutput.DEFAULT_PROPERTIES.message
    this.time = data.time ?? MissionOutput.DEFAULT_PROPERTIES.time
    this.timeStamp =
      data.timeStamp ?? MissionOutput.DEFAULT_PROPERTIES.timeStamp

    this.force = force
    this.node = null as any
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

  /**
   * Converts the output to JSON.
   * @returns The JSON representation of the output.
   */
  public toJson(): TOutputJson {
    return {
      _id: this._id,
      type: this.type,
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
  public static get DEFAULT_PROPERTIES(): TOutputJson {
    return {
      _id: StringToolbox.generateRandomId(),
      type: 'custom',
      forceId: '',
      nodeId: null,
      actionId: null,
      prefix: '',
      message: '',
      time: Date.now(),
      timeStamp: MissionOutput.FORMAT_TIME(Date.now()),
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
 * Different types of outputs that can be displayed
 * in a force's output panel.
 */
type TOutputType =
  | 'custom'
  | 'intro'
  | 'execution-failed'
  | 'execution-started'
  | 'execution-succeeded'
  | 'pre-execution'
  | 'dynamic'

/**
 * Plain JSON representation of an output for a force's output panel.
 */
export type TOutputJson = {
  /**
   * The output's ID.
   */
  _id: string
  /**
   * Differentiates different types of outputs being used.
   */
  type: TOutputType
  /**
   * The ID of the force where the output panel belongs.
   */
  forceId: TMissionForceSaveJson['_id']
  /**
   * The ID of the node that the session member interacted with to trigger the output.
   */
  nodeId: TMissionNodeJson['_id'] | null
  /**
   * The ID of the action that's being executed.
   */
  actionId: TMissionActionJson['_id'] | null
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
