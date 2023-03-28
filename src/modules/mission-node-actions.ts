import { PRNG } from 'seedrandom'
import { assetTestData } from '../asset-test-data'
import ExecuteNodePath from '../components/content/game/ExecuteNodePath'
import { MissionNode } from './mission-nodes'
import { Mission } from './missions'
import { AnyObject } from './toolbox/objects'

export interface IMissionNodeActionJSON {
  actionID: string
  name: string
  description: string
  processTime: number
  successChance: number
  resourceCost: number
  postExecutionSuccessText: string
  postExecutionFailureText: string
  commandScripts: Array<string>
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
  commandScripts: Array<string>
  _willSucceedArray: Array<boolean>
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
  get willSucceedArray(): Array<boolean> {
    return this._willSucceedArray
  }

  // Getter for _willSucceed
  get willSucceed(): boolean | null {
    return this._willSucceed
  }

  // Gets the total amount of attempts
  // that a user can have to execute a node
  get totalPossibleExecutionAttempts(): number {
    return Math.floor(this.node.mission.initialResources / this.resourceCost)
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
    commandScripts: Array<string>,
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
    this.commandScripts = commandScripts
    this._willSucceedArray =
      MissionNodeAction.determineDifferentSuccessOutcomes(
        this.totalPossibleExecutionAttempts,
        successChance,
        node.mission.rng,
      )
    this._willSucceed = null
  }

  toJSON(): IMissionNodeActionJSON {
    return {
      actionID: this.actionID,
      name: this.name,
      description: this.description,
      processTime: this.processTime,
      successChance: this.successChance,
      resourceCost: this.resourceCost,
      postExecutionSuccessText: this.postExecutionSuccessText,
      postExecutionFailureText: this.postExecutionFailureText,
      commandScripts: this.commandScripts,
    }
  }

  // This will determine whether a
  // node action succeeds or fails based
  // on the success chance passed.
  static determineDifferentSuccessOutcomes = (
    totalExecutionAttempts: number,
    successChance: number,
    rng: PRNG,
  ): Array<boolean> => {
    let willSucceedArray: Array<boolean> = []
    let willSucceed: boolean = false

    for (let i = 0; i < totalExecutionAttempts && !willSucceed; i++) {
      willSucceed = rng.double() <= successChance
      willSucceedArray.push(willSucceed)
    }

    return willSucceedArray
  }

  // After the node is executed, the willSucceed that was just used is
  // removed from the "willSucceedArray" so that if the user re-executes
  // they can potentially see a different result.
  updateWillSucceedArray(): Array<boolean> {
    this._willSucceedArray.shift()

    return this._willSucceedArray
  }

  // This updates the "willSucceed" property for re-execution purposes
  updateWillSucceed(): boolean {
    this._willSucceed = this._willSucceedArray[0]

    return this._willSucceed
  }

  // This will be called upon action
  // execution completion.
  _handleExecutionEnd = (success: boolean): void => {
    let node: MissionNode = this.node

    node.handleActionExecutionEnd()

    if (success) {
      if (node.hasChildren && !node.isOpen) {
        node.open()
      }
      ExecuteNodePath.handleExecutionSuccess(this)
    } else if (!success) {
      ExecuteNodePath.handleExecutionFailure(this)
    }
  }

  // This will execute the action.
  execute(): void {
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
      this._handleExecutionEnd(willSucceed)
      this.updateWillSucceedArray()
    }, processTime)
  }
}

export default MissionNodeAction
