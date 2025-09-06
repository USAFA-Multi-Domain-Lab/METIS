import React from 'react'
import ClientOutput from '../../../../missions/forces/outputs'

/**
 * Prop type for `Output`.
 */
export type TOutput_P = {
  /**
   * The output for the force's output panel.
   */
  output: ClientOutput
}

/**
 * State type for `Output`.
 */
export type TOutput_S = {}

/**
 * The output context data provided to all children
 * of `Output`.
 */
export type TOutputContextData = {
  /**
   * The ref for the root element of the output.
   */
  root: React.RefObject<HTMLDivElement>
} & Required<TOutput_P> & {
    /**
     * The state for the output.
     */
    state: TOutput_S
  }

/**
 * Valid HTML tags that can be used in an output message,
 * which will be rendered to their respective before
 * being displayed to the user.
 */
type TOutputTag =
  | 'resource-label'
  | 'node-name'
  | 'action-name'
  | 'action-description'
  | 'success-chance'
  | 'process-time'
  | 'time-remaining'
  | 'resource-cost'
  | 'opens-node'
  | 'execution-state'

/**
 * A renderer function for a specific HTML tag which
 * will convert the tag to a string, which will then
 * be displayed to the user.
 */
type TOutputTagRenderer = (output: ClientOutput) => string

/**
 * The results of the `useOutputRenderer` hook.
 */
export type TOutputRendererResults = {
  /**
   * A unique identifier that changes every
   * time the output is rendered.
   */
  key: string
  /**
   * The rendered output message.
   */
  renderedMessage: string
}
