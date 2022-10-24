import NodeStructureReference from './node-reference'
import { Counter, isInteger } from './numbers'
import { cloneDeep } from 'lodash'
import { AnyObject } from 'mongoose'
import seedrandom, { PRNG } from 'seedrandom'
import axios, { AxiosResponse } from 'axios'

// This is the raw mission data returned
// from the server used to create instances
// of the Mission class.
export interface IMissionJson {
  name: string
  versionNumber: number
  seed: number
  nodeStructure: object
  nodeData: object
}

// This is the raw node data returned
// from the server used to create instances
// of MissionNode in the Mission class.
export interface IMissionNodeJson {
  executing: boolean
  nodeID: string
  name: string
  color: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  executable: boolean
  nodeActionItems: Array<{
    text: string
    timeDelay: number
    successChance: number
    willSucceed: boolean
  }>
}

// These are options available to
// some using the renderMission function
// in the Mission class.
export interface IMissionRenderOptions {
  // This will ignore whether a node is
  // expanded or collapsed and render
  // everything regardless.
  ignoreVisibility?: boolean
}

export class MissionNodeAction {
  text: string
  timeDelay: number
  successChance: number
  willSucceed: boolean

  constructor(
    text: string,
    timeDelay: number,
    successChance: number,
    willSucceed: boolean,
  ) {
    this.text = text
    this.timeDelay = timeDelay
    this.successChance = successChance
    this.willSucceed = willSucceed
  }
}

// This represents an individual node
// for a student to execute within a
// mission.
export class MissionNode {
  nodeID: string
  name: string
  color: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  executable: boolean
  nodeActionItems: Array<MissionNodeAction>
  selectedNodeAction: MissionNodeAction | null
  _executed: boolean
  _executing: boolean
  mapX: number
  mapY: number

  get willSucceed(): boolean {
    let willSucceed: boolean = false
    let selectedNodeAction: MissionNodeAction | null = this.selectedNodeAction

    if (selectedNodeAction !== null) {
      willSucceed = selectedNodeAction.willSucceed
    }

    return willSucceed
  }

  get executed(): boolean {
    return this._executed
  }

  get succeeded(): boolean {
    return this._executed && this.willSucceed
  }

  get executing(): boolean {
    return this._executing
  }

  get successChance(): number | null {
    let successChance: number | null = null

    if (this.selectedNodeAction !== null) {
      successChance = this.selectedNodeAction.successChance
    }

    return successChance
  }

  constructor(
    nodeID: string,
    name: string,
    color: string,
    preExecutionText: string,
    postExecutionSuccessText: string,
    postExecutionFailureText: string,
    actionData: string,
    executable: boolean,
    nodeActionItems: Array<MissionNodeAction>,
    mapX: number,
    mapY: number,
  ) {
    this.nodeID = nodeID
    this.name = name
    this.color = color
    this.preExecutionText = preExecutionText
    this.postExecutionSuccessText = postExecutionSuccessText
    this.postExecutionFailureText = postExecutionFailureText
    this.actionData = actionData
    this.executable = executable
    this.nodeActionItems = nodeActionItems
    this.selectedNodeAction = null
    this._executed = false
    this._executing = false
    this.mapX = mapX
    this.mapY = mapY
  }

  isExecuting(): boolean {
    if (this.executable === true && this.executed === false) {
      this._executing = true
    } else if (this.executable === true && this.executed === true) {
      this._executing = false
    }
    return this._executing
  }

  // This will execute the node if it
  // is executable and then return
  // whether the node was successfully
  // executed or not.
  execute(): boolean {
    if (this.executable) {
      this._executed = true
    }
    return this._executed
  }
}

// This represents a mission for a
// student to complete.
export class Mission {
  name: string
  versionNumber: number
  nodeStructure: object
  nodeData: Map<string, MissionNode>
  seed: number

  constructor(
    name: string,
    versionNumber: number,
    nodeStructure: object,
    nodeData: Map<string, MissionNode>,
    seed: number,
  ) {
    this.name = name
    this.versionNumber = versionNumber
    this.nodeStructure = nodeStructure
    this.nodeData = nodeData
    this.seed = seed
  }

  // This will determine whether a
  // node succeeds or fails based
  // on the success chance passed.
  static determineNodeSuccess = (successChance: number, rng: PRNG): boolean => {
    return rng.double() <= successChance
  }

  // This will create a new Mission
  // object from the JSON data returned
  // from the server.
  static fromJson(json: IMissionJson): Mission {
    try {
      // Define variables, grabbing needed
      // data from the JSON passed.
      let mission: Mission
      let name: string = json.name
      let versionNumber: number = json.versionNumber
      let seed: number = json.seed
      let nodeStructure: object = json.nodeStructure
      let nodeDataJson: object = json.nodeData
      let nodeData: Map<string, MissionNode> = new Map<string, MissionNode>()
      let nodeDataKeys: string[] = Object.keys(nodeDataJson)

      // Throws error if versionNumber is
      // not an integer.
      if (!isInteger(versionNumber)) {
        throw new Error()
      }

      // Set seed for random so that we get
      // the same success/failure results
      // for the nodes in this mission as other
      // students taking this mission.
      let rng = seedrandom(`${seed}`)

      // Converts raw node data into MissionNode
      // objects, then it stores the created
      // objects in the nodeData map.
      for (let key of nodeDataKeys) {
        let nodeDatum: IMissionNodeJson = (nodeDataJson as any)[key]
        let nodeActionItems = []

        for (let actionItem of nodeDatum.nodeActionItems) {
          let willSucceed: boolean = Mission.determineNodeSuccess(
            actionItem.successChance,
            rng,
          )
          let nodeAction: MissionNodeAction = new MissionNodeAction(
            actionItem.text,
            actionItem.timeDelay,
            actionItem.successChance,
            willSucceed,
          )
          nodeActionItems.push(nodeAction)
        }

        let node: MissionNode = new MissionNode(
          nodeDatum.nodeID,
          nodeDatum.name,
          nodeDatum.color,
          nodeDatum.preExecutionText,
          nodeDatum.postExecutionSuccessText,
          nodeDatum.postExecutionFailureText,
          nodeDatum.actionData,
          nodeDatum.executable,
          nodeActionItems,
          0,
          0,
        )

        nodeData.set(key, node)
      }

      // Create mission object and return it.
      mission = new Mission(name, versionNumber, nodeStructure, nodeData, seed)
      return mission
    } catch (error) {
      console.error('Invalid JSON passed to create Mission object.')
      throw error
    }
  }

  // This will construct a new mission
  // based on the original mission and
  // a node structure reference that represents
  // that mission. The node structure reference
  // will be read to determine all the currently
  // expanded and collapsed nodes, rendering a
  // mission that only display the nodes that
  // have been expanded into view.
  static renderMission = (
    originalMission: Mission,
    nodeStructureReference: NodeStructureReference,
    nodeStructure: AnyObject,
    options: IMissionRenderOptions = {},
    missionRender: Mission | null = null,
    depth: number = -1,
    rowCount: Counter = new Counter(0),
  ): Mission => {
    // If mission render is null,
    // then this should be the functions
    // initial call before any recursion.
    // Therefore the missionRender should
    // be initialized.
    if (missionRender === null) {
      missionRender = new Mission(
        originalMission.name,
        originalMission.versionNumber,
        cloneDeep(originalMission.nodeStructure),
        new Map<string, MissionNode>(),
        originalMission.seed,
      )
      nodeStructure = missionRender.nodeStructure
    }
    // Else, this function was recursively
    // called with a reference to a particular
    // node in the mission. This node should be
    // included in the nodeData for the missionRender
    // so that it displays.
    else {
      let nodeID: string = nodeStructureReference.nodeID
      let nodeDatum: MissionNode | undefined =
        originalMission.nodeData.get(nodeID)

      if (nodeDatum !== undefined) {
        nodeDatum.mapX = depth
        nodeDatum.mapY = rowCount.count
        missionRender.nodeData.set(nodeID, nodeDatum)
      } else {
        console.error(
          new Error(
            `Cannot render mission since the nodeDatum with the ID ${nodeID} could not be found in the original mission:`,
          ),
        )
        return new Mission(
          originalMission.name,
          originalMission.versionNumber,
          {},
          new Map<string, MissionNode>(),
          originalMission.seed,
        )
      }
    }

    let subnodes = nodeStructureReference.subnodes
    // If the current node being examined is
    // collapsed, then this recursive function
    // should not dig deeper, and the render is
    // returned up the chain.
    if (!options.ignoreVisibility && nodeStructureReference.isCollapsed) {
      for (let key of Object.keys(nodeStructure)) {
        delete nodeStructure[key]
      }
      return missionRender
    }
    // Else, the node is expanded, the subnodes
    // should then be examined by recursively
    // calling this function.
    else {
      subnodes.forEach((subnode: NodeStructureReference, index: number) => {
        if (!(subnode.nodeID in nodeStructure)) {
          console.error(
            new Error(
              `Cannot render mission since the nodeReference subnode ${subnode.nodeID} cannot be found in nodeStructure:`,
            ),
          )
          return new Mission(
            originalMission.name,
            originalMission.versionNumber,
            {},
            new Map<string, MissionNode>(),
            originalMission.seed,
          )
        }

        let substructure: AnyObject = nodeStructure[subnode.nodeID]

        if (index > 0) {
          rowCount.increment()
        }

        Mission.renderMission(
          originalMission,
          subnode,
          substructure,
          options,
          missionRender,
          depth + 1,
          rowCount,
        )
      })
    }

    return missionRender
  }
}

// This gets the data from the database
// and creates a specific mission based
// on the data it returns
export function getMission(callback: (mission: Mission) => void): void {
  axios
    .get('/api/v1/missions/')
    .then((response: AxiosResponse<AnyObject>): void => {
      console.log(response.data.mission)
      callback(response.data.mission)
    })
}

export default {
  MissionNode,
  Mission,
  getMission,
}
