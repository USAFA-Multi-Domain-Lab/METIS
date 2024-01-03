import axios, { AxiosError } from 'axios'
import { PRNG } from 'seedrandom'
import ExecuteNodePath from '../components/content/game/ExecuteNodePath'
import { MissionNode } from './mission-nodes'
import { Mission } from './missions'
import { AnyObject } from './toolbox/objects'

export interface IScript {
  label: string
  description: string
  scriptName: string
  originalPath: string
  args: AnyObject
}

export interface IMissionNodeActionJSON {
  actionID: string
  name: string
  description: string
  processTime: number
  successChance: number
  resourceCost: number
  postExecutionSuccessText: string
  postExecutionFailureText: string
  scripts: IScript[]
}

export class MissionNodeAction {
  node: MissionNode
  actionID: string
  name: string
  description: string
  processTime: number
  successChance: number
  resourceCost: number
  postExecutionSuccessText: string
  postExecutionFailureText: string
  scripts: IScript[]
  _willSucceedArray: boolean[]
  _willSucceed: boolean | null

  // This will be called if all the
  // necessary conditions are met to
  // execute a node action.
  get readyToExecute(): boolean {
    let node: MissionNode = this.node
    let mission: Mission = node.mission
    let resourceCost: number = this.resourceCost

    return (
      resourceCost <= mission.resources &&
      node.executable &&
      !this.succeeded &&
      this._willSucceedArray.length !== 0
    )
  }

  // Getter for _willSucceedArray
  get willSucceedArray(): boolean[] {
    return this._willSucceedArray
  }

  // Getter for _willSucceed
  get willSucceed(): boolean | null {
    return this._willSucceed
  }

  // Gets the total amount of attempts
  // that a user can have to execute a node
  get totalPossibleExecutionAttempts(): number {
    let amountOfAttempts: number = 0

    // If the resource cost is 0, then the user
    // can execute the action up to the max amount
    // of attempts.
    if (this.resourceCost === 0) {
      amountOfAttempts = this.MAX_EXECUTION_ATTEMPTS
    }
    // If the initial resources is greater than 0,
    // then the amount of attempts is calculated
    // based on the initial resources divided by
    // the resource cost.
    else if (this.node.mission.initialResources > 0) {
      amountOfAttempts = Math.floor(
        this.node.mission.initialResources / this.resourceCost,
      )
    }

    // The amount of attempts cannot exceed the
    // max amount of attempts.
    amountOfAttempts = Math.min(amountOfAttempts, this.MAX_EXECUTION_ATTEMPTS)

    return amountOfAttempts
  }

  // Determines if a node succeeded or not
  // after it is executed
  get succeeded(): boolean | null {
    return this.node.executed && this._willSucceed
  }

  constructor(
    node: MissionNode,
    actionID: string,
    name: string,
    description: string,
    processTime: number,
    successChance: number,
    resourceCost: number,
    postExecutionSuccessText: string,
    postExecutionFailureText: string,
    scripts: IScript[],
  ) {
    this.node = node
    this.actionID = actionID
    this.name = name
    this.description = description
    this.processTime = processTime
    this.successChance = successChance
    this.resourceCost = resourceCost
    this.postExecutionSuccessText = postExecutionSuccessText
    this.postExecutionFailureText = postExecutionFailureText
    this.scripts = scripts
    this._willSucceedArray =
      MissionNodeAction.determineDifferentSuccessOutcomes(
        this.totalPossibleExecutionAttempts,
        successChance,
        node.mission.rng,
      )
    this._willSucceed = null
  }

  public toJSON(): IMissionNodeActionJSON {
    return {
      actionID: this.actionID,
      name: this.name,
      description: this.description,
      processTime: this.processTime,
      successChance: this.successChance,
      resourceCost: this.resourceCost,
      postExecutionSuccessText: this.postExecutionSuccessText,
      postExecutionFailureText: this.postExecutionFailureText,
      scripts: this.scripts,
    }
  }

  // After the node is executed, the willSucceed that was just used is
  // removed from the "willSucceedArray" so that if the user re-executes
  // they can potentially see a different result.
  public updateWillSucceedArray(): boolean[] {
    this._willSucceedArray.shift()

    return this._willSucceedArray
  }

  // This updates the "willSucceed" property for re-execution purposes
  public updateWillSucceed(): boolean {
    this._willSucceed = this._willSucceedArray[0]

    return this._willSucceed
  }

  // This will be called upon action
  // execution completion.
  private _handleExecutionEnd = (
    success: boolean,
    useAssets: boolean,
  ): void => {
    let node: MissionNode = this.node
    let mission: Mission = node.mission

    node.handleActionExecutionEnd()

    if (success) {
      if (node.hasChildren && !node.isOpen) {
        node.open()
      }
      ExecuteNodePath.handleExecutionSuccess(this)
    } else if (!success) {
      ExecuteNodePath.handleExecutionFailure(this)
    }

    if (success && useAssets) {
      handleSuccessfulActionExecution(
        mission.missionID,
        node.nodeID,
        this.actionID,
      )
    }
  }

  // This will execute the action.
  public execute(useAssets: boolean): void {
    let node: MissionNode = this.node
    let mission: Mission = node.mission
    let resourceCost: number = this.resourceCost
    let processTime: number = this.processTime
    let willSucceed: boolean = this.willSucceedArray[0]

    if (!this.readyToExecute) {
      throw Error('This action cannot currently be executed.')
    }

    mission.resources -= resourceCost

    node.handleActionExecutionStart(this)

    setTimeout(() => {
      this.updateWillSucceed()
      this._handleExecutionEnd(willSucceed, useAssets)
      this.updateWillSucceedArray()
    }, processTime)
  }

  // This is the max amount of attempts
  // that a user can have to execute an
  // action.
  public readonly MAX_EXECUTION_ATTEMPTS = 64

  // This will determine whether a
  // node action succeeds or fails based
  // on the success chance passed.
  private static determineDifferentSuccessOutcomes = (
    totalExecutionAttempts: number,
    successChance: number,
    rng: PRNG,
  ): boolean[] => {
    let willSucceedArray: boolean[] = []
    let willSucceed: boolean = false

    for (let i = 0; i < totalExecutionAttempts && !willSucceed; i++) {
      willSucceed = rng.double() <= successChance
      willSucceedArray.push(willSucceed)
    }

    return willSucceedArray
  }
}

/**
 * This will handle successful action execution.
 * @param missionID The mission's ID
 * @param nodeID The node's ID
 * @param actionID The action's ID
 * @deprecated
 */
export function handleSuccessfulActionExecution(
  missionID: string,
  nodeID: string,
  actionID: string,
): void {
  axios
    .put(`/api/v1/missions/handle-action-execution/`, {
      missionID: missionID,
      nodeID: nodeID,
      actionID: actionID,
    })
    .catch((error: AxiosError) => {
      console.error('Failed to handle successful action execution.')
      console.error(error)
    })
}

export default { MissionNodeAction, handleSuccessfulActionExecution }
