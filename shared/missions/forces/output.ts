import memoizeOne from 'memoize-one/dist/memoize-one'
import Mission from 'metis/missions'
import { TExecution } from 'metis/missions/actions/executions'
import { TForce, TMissionForceSaveJson } from '.'
import { MetisComponent, TMetisBaseComponents } from '../../'

/**
 * An output that's displayed in a force's output panel.
 */
export default abstract class MissionOutput<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  // Overriden
  public get name(): string {
    return this._id.substring(0, 8)
  }

  /**
   * Context for the output, providing additional
   * information about the output and where it
   * came from.
   */
  public readonly context: TOutputContext

  /**
   * Differentiates the purpose/source of the outputs being used.
   */
  public get type(): TOutputType {
    return this.context.type
  }

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
   * A memoized function that returns the source node
   * referenced in the context, searching for it within
   * the mission.
   * @param nodeId The ID of the node to find.
   * @returns The node in question, null if not found.
   * @memoized Recomputes when `nodeId` changes.
   */
  private sourceNodeMemo = memoizeOne((nodeId: string): T['node'] | null => {
    // todo: It may be useful to track when the
    // todo: node is referenced but not found in
    // todo: the mission. Perhaps the node is
    // todo: part of a different force, and therefore
    // todo: inaccessible, but very much a real node.
    return this.mission.getNodeById(nodeId) ?? null
  })

  /**
   * A memoized function that returns the source execution
   * referenced in the context, searching for it within
   * the mission.
   * @param executionId The ID of the execution to find.
   * @returns The execution in question, null if not found.
   * @memoized Recomputes when `executionId` changes.
   */
  private sourceExecutionMemo = memoizeOne(
    (executionId: string): TExecution<T> | null => {
      // todo: It may be useful to track when the
      // todo: execution is referenced but not found in
      // todo: the mission. Perhaps the execution is
      // todo: part of a different force, and therefore
      // todo: inaccessible, but very much a real execution.
      return this.mission.getExecution(executionId) ?? null
    },
  )

  /**
   * The node that invoked the output, or associated
   * with the mission component that invoked the output,
   * if any.
   */
  public get sourceNode(): T['node'] | null {
    const { context } = this

    switch (context.type) {
      case 'intro':
      case 'custom':
        return null
      case 'pre-execution':
        return this.sourceNodeMemo(context.sourceNodeId)
      // Default is necessary here, instaed of case statements.
      // If a new output type is added, the linting will redline here,
      // forcing the developer to add a new case. Otherwise,
      // null may be returned when a node should be returned.
      default:
        let execution = this.sourceExecutionMemo(context.sourceExecutionId)
        return execution?.node ?? null
    }
  }

  /**
   * The action associated with the mission component
   * that invoked the output, if any.
   */
  public get sourceAction(): T['action'] | null {
    const { context } = this

    switch (context.type) {
      case 'intro':
      case 'custom':
      case 'pre-execution':
        return null
      // Default is necessary here, instaed of case statements.
      // If a new output type is added, the linting will redline here,
      // forcing the developer to add a new case. Otherwise,
      // null may be returned when an action should be returned.
      default:
        let execution = this.sourceExecutionMemo(context.sourceExecutionId)
        return execution?.action ?? null
    }
  }

  /**
   * The execution that invoked the output, or associated
   * with the mission component that invoked the output,
   * if any.
   */
  public get sourceExecution(): T['execution'] | null {
    const { context } = this

    switch (context.type) {
      case 'intro':
      case 'custom':
      case 'pre-execution':
        return null
      // Default is necessary here, instaed of case statements.
      // If a new output type is added, the linting will redline here,
      // forcing the developer to add a new case. Otherwise,
      // null may be returned when an execution should be returned.
      default:
        return this.sourceExecutionMemo(context.sourceExecutionId)
    }
  }

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
  public get timeStamp(): string {
    return MissionOutput.formatTime(this.time)
  }

  /**
   * @param force The force where the output panel belongs.
   * @param data The output data from which to create the output.
   * @param options The options for creating the output.
   */
  public constructor(force: TForce<T>, data: TOutputJson) {
    super(data._id, '', false)

    this.context = data.context
    this.prefix = data.prefix
    this.message = data.message
    this.time = data.time
    this.force = force

    if (force._id !== data.forceId) {
      throw new Error(
        `Force ID "${data.forceId}" in the data does not match the ID of the force "${force._id}" passed.`,
      )
    }
  }

  /**
   * Converts the output to JSON.
   * @returns The JSON representation of the output.
   */
  public toJson(): TOutputJson {
    return {
      _id: this._id,
      forceId: this.force._id,
      context: this.context,
      prefix: this.prefix,
      message: this.message,
      time: this.time,
    }
  }

  /**
   * Formats the time.
   * @param time The time to format.
   * @returns The formatted time as a string.
   */
  public static formatTime(time: number): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(time)
  }
}

/**
 * Output types where the output is not specific
 * to a node or execution.
 */
export type TOutputTypeSimple = 'custom' | 'intro'

/**
 * Output types where the output is specific to a node.
 */
export type TOutputTypeNode = 'pre-execution'

/**
 * Output types where the output is specific to an execution.
 */
export type TOutputTypeExecution =
  | 'execution-failed'
  | 'execution-started'
  | 'execution-succeeded'

/**
 * Differentiates the purpose/source of the outputs being used.
 */
export type TOutputType =
  | TOutputTypeSimple
  | TOutputTypeNode
  | TOutputTypeExecution

/**
 * Context used for an output that needs no extra context.
 */
export interface TOutputContextSimple {
  /**
   * Differentiates the purpose/source of the outputs being used.
   */
  type: TOutputTypeSimple
}

/**
 * Context used for an output that needs the context
 * of the node that invoked it.
 */
export interface TOutputContextNode {
  /**
   * Differentiates the purpose/source of the outputs being used.
   */
  type: TOutputTypeNode
  /**
   * The ID of the node that invoked the output.
   */
  sourceNodeId: MetisComponent['_id']
}

/**
 * Context used for an output that needs the context
 * of the execution that invoked it.
 */
export interface TOutputContextExecution {
  /**
   * Differentiates the purpose/source of the outputs being used.
   */
  type: TOutputTypeExecution
  /**
   * The ID of the execution that invoked the output.
   */
  sourceExecutionId: MetisComponent['_id']
}

/**
 * Additional context used for an output, specific
 * to the output's type.
 */
export type TOutputContext =
  | TOutputContextSimple
  | TOutputContextNode
  | TOutputContextExecution

/**
 * Plain JSON representation of an output for a force's output panel.
 */
export type TOutputJson = {
  /**
   * The output's ID.
   */
  _id: string
  /**
   * The ID of the force where the output panel belongs.
   */
  forceId: TMissionForceSaveJson['_id']
  /**
   * Context used for the output.
   */
  context: TOutputContext
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
}

/**
 * Extracts the output type from a registry of
 * METIS components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The output type.
 */
export type TOutput<T extends TMetisBaseComponents> = T['output']
