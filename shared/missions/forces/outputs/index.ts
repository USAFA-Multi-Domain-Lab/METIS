import { TCommonMissionTypes } from 'metis/missions'
import { TCommonMissionForce, TCommonMissionForceJson } from '..'
import { TCustom, TCustomJson } from './custom'
import { TExecutionFailed, TExecutionFailedJson } from './execution-failed'
import { TExecutionStarted, TExecutionStartedJson } from './execution-started'
import {
  TExecutionSucceeded,
  TExecutionSucceededJson,
} from './execution-succeeded'
import { TIntro, TIntroJson } from './intro'
import { TPreExecution, TPreExecutionJson } from './pre-execution'

/**
 * The base properties for an output.
 */
export type TBaseOutput = {
  /**
   * The output's ID.
   */
  _id: string
  /**
   * The ID of the force where the output panel belongs.
   */
  forceId: TCommonMissionForce['_id']
  /**
   * The time the output was sent.
   */
  time: number
  /**
   * Converts the output to JSON.
   */
  toJson: () => TCommonOutputJson
}

/**
 * Plain JSON representation of the base properties for an output.
 */
export type TBaseOutputJson = {
  /**
   * The output's ID.
   */
  _id: string
  /**
   * The ID of the force where the output panel belongs.
   */
  forceId: TCommonMissionForceJson['_id']
  /**
   * The time the output was sent.
   */
  time: number
}

/**
 * Represents an output for a force's output panel.
 */
export type TCommonOutput =
  | TIntro
  | TPreExecution
  | TExecutionStarted
  | TExecutionSucceeded
  | TExecutionFailed
  | TCustom

/**
 * Plain JSON representation of an output for a force's output panel.
 */
export type TCommonOutputJson =
  | TIntroJson
  | TPreExecutionJson
  | TExecutionStartedJson
  | TExecutionSucceededJson
  | TExecutionFailedJson
  | TCustomJson

/**
 * Extracts the output type from the mission types.
 * @param T The mission types.
 * @returns The output's type.
 */
export type TOutput<T extends TCommonMissionTypes> = T['output']
