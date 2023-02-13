import { PRNG } from 'seedrandom'
import { MissionNode } from './mission-nodes'

export interface IMissionNodeActionJSON {
  actionID: string
  name: string
  description: string
  processTime: number
  successChance: number
  resourceCost: number
  postExecutionSuccessText: string
  postExecutionFailureText: string
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
  _willSucceedArray: Array<boolean>
  _willSucceed: boolean | null

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
  get totalExecutionAttempts(): number {
    return Math.floor(this.node.mission.initialResources / this.resourceCost)
  }

  // Determines if a node succeeded or not
  // after it is executed
  get succeeded(): boolean | null {
    return this.node.executed && this.willSucceed
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
    this._willSucceedArray =
      MissionNodeAction.determineDifferentSuccessOutcomes(
        this.totalExecutionAttempts,
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

  // This will execute the selected
  // node action after the time delay
  // of the selected node action.
  executeAction(callback: (success: boolean) => void): void {
    let selectedAction: MissionNodeAction | null = this

    if (this.totalExecutionAttempts > 0) {
      if (
        (this.node.executable === true && selectedAction !== null) ||
        (this.succeeded === false && selectedAction !== null)
      ) {
        this.node.executing = true

        setTimeout(() => {
          this.node.executing = false
          this.node.executed = true

          if (this.willSucceed !== null) {
            callback(this.willSucceed)
          }
        }, selectedAction.processTime)
      } else if (
        selectedAction !== null &&
        (this.succeeded === null || this.willSucceed === null)
      ) {
        console.error(
          `The "willSucceed" property for the action called ${selectedAction.name} on the node called ${this.node.name} is null.`,
        )
      }
    }
  }
}

export default { MissionNodeAction }
