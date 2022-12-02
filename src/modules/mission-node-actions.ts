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
  _willSucceed: boolean

  // Getter for _willSucceed
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
    this._willSucceed = MissionNodeAction.determineActionSuccess(
      successChance,
      node.mission.rng,
    )
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
  static determineActionSuccess = (
    successChance: number,
    rng: PRNG,
  ): boolean => {
    return rng.double() <= successChance
  }
}

export default { MissionNodeAction }
