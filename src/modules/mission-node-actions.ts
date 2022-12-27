import { PRNG } from 'seedrandom'
import { MissionNode } from './mission-nodes'
import { Mission } from './missions'

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
  _willSucceed: boolean

  // Getter for _willSucceedArray
  get willSucceedArray(): Array<boolean> {
    return this._willSucceedArray
  }

  get willSucceed(): boolean {
    return this._willSucceed
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
        node,
        successChance,
        node.mission.rng,
      )
    this._willSucceed = this._willSucceedArray[0]
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
    node: MissionNode,
    successChance: number,
    rng: PRNG,
  ): Array<boolean> => {
    let willSucceedArray: Array<boolean> = []
    let totalExecutionAttempts: number = node.totalExecutionAttempts

    for (let i = 0; i < totalExecutionAttempts; i++) {
      let willSucceed: boolean = rng.double() <= successChance
      willSucceedArray.push(willSucceed)
    }

    return willSucceedArray
  }

  // After the node is executed, the willSucceed that was just used is
  // removed from the willSucceedArray so that if the user re-executes
  // they can potentially see a different result.
  updateWillSucceedArray(): Array<boolean> {
    this._willSucceedArray.shift()

    return this._willSucceedArray
  }

  updateWillSucceed(): boolean {
    this._willSucceed = this._willSucceedArray[0]

    return this._willSucceed
  }
}

export default { MissionNodeAction }
