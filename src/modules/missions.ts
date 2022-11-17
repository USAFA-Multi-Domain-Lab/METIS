import { Counter } from './numbers'
import seedrandom, { PRNG } from 'seedrandom'
import { v4 as generateHash } from 'uuid'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { AnyObject } from './toolbox/objects'
import { MissionNode } from './mission-nodes'
import { MissionNodeAction } from './mission-node-actions'
import { AjaxStatus } from '../components/content/AjaxStatusDisplay'

// This is the method that the clone
// function in the Mission class uses
// to clone a mission.
export enum EMissionCloneMethod {
  LikeOriginal,
  IncludeModifications,
}

// This is the raw mission data returned
// from the server used to create instances
// of the Mission class.
export interface IMissionJSON {
  missionID: string
  name: string
  versionNumber: number
  live: boolean
  initialResources: number
  seed: string
  nodeStructure: AnyObject
  nodeData: Array<AnyObject>
}

// This is a config that can be passed
// when cloning a mission to configure
// how you want this mission to be cloned.
export interface IMissionCloneOptions {
  method: EMissionCloneMethod
  expandAll?: boolean
}

// This represents a mission for a
// student to complete.
export class Mission {
  static setRequestInProgress() {
    throw new Error('Method not implemented.')
  }
  missionID: string
  name: string
  versionNumber: number
  live: boolean
  initialResources: number
  resources: number
  _originalNodeStructure: AnyObject
  _originalNodeData: Array<AnyObject>
  _nodeStructure: AnyObject
  _nodeData: Array<AnyObject>
  _nodeStructureLastChangeKey: string
  _nodeDataLastChangeKey: string
  nodes: Map<string, MissionNode>
  seed: string
  rng: PRNG
  rootNode: MissionNode
  structureChangeKey: string
  structureChangeHandlers: Array<(structureChangeKey: string) => void>
  _disableNodes: boolean

  // This will return the node
  // structure for the mission,
  // updating it if the mission
  // has been modified.
  get nodeStructure(): AnyObject {
    if (this._nodeStructureLastChangeKey !== this.structureChangeKey) {
      this._nodeStructure = this._exportNodeStructure()
      this._nodeStructureLastChangeKey = this.structureChangeKey
    }

    return this._nodeStructure
  }

  // This will return the node
  // data for the mission,
  // updating it if the mission
  // has been modified.
  get nodeData(): Array<AnyObject> {
    if (this._nodeDataLastChangeKey !== this.structureChangeKey) {
      this._nodeData = this._exportNodeData()
      this._nodeDataLastChangeKey = this.structureChangeKey
    }
    return this._nodeData
  }

  get disableNodes(): boolean {
    return this._disableNodes
  }

  constructor(
    missionID: string,
    name: string,
    versionNumber: number,
    live: boolean,
    initialResources: number,
    nodeStructure: AnyObject,
    nodeData: Array<AnyObject>,
    seed: string,
    expandAll: boolean = false,
  ) {
    this.missionID = missionID
    this.name = name
    this.versionNumber = versionNumber
    this.live = live
    this.initialResources = initialResources
    this.resources = initialResources
    this._nodeStructure = nodeStructure
    this._nodeData = nodeData
    this._originalNodeStructure = nodeStructure
    this._originalNodeData = nodeData
    this.nodes = new Map<string, MissionNode>()
    this.seed = seed
    this.rng = seedrandom(`${seed}`)
    this.rootNode = new MissionNode(
      this,
      'ROOT',
      'ROOT',
      'default',
      'N/A',
      'N/A',
      'N/A',
      false,
      false,
      [],
      0,
      0,
    )
    this.structureChangeKey = generateHash()
    this._nodeStructureLastChangeKey = this.structureChangeKey
    this._nodeDataLastChangeKey = this.structureChangeKey
    this.structureChangeHandlers = []
    this._disableNodes = false

    this._importNodeData(nodeData)
    this._importNodeStructure(nodeStructure, this.rootNode, expandAll)

    if (this.rootNode.expandable) {
      this.rootNode.expand()
    } else {
      this.positionNodes()
    }
  }

  // This will determine the relationship
  // between nodes, parent to child and
  // vise-versa.
  _importNodeStructure(
    nodeStructure: AnyObject,
    rootNode: MissionNode = this.rootNode,
    expandAll: boolean = false,
  ): MissionNode {
    let nodes: Map<string, MissionNode> = this.nodes
    let childNodes: Array<MissionNode> = []
    let childNodeKeyValuePairs: Array<[string, AnyObject]> = Object.keys(
      nodeStructure,
    ).map((key: string) => [key, nodeStructure[key]])

    for (let childNodeKeyValuePair of childNodeKeyValuePairs) {
      let key: string = childNodeKeyValuePair[0]
      let value: AnyObject = childNodeKeyValuePair[1]
      let childNode: MissionNode | undefined = nodes.get(key)

      if (childNode !== undefined) {
        childNodes.push(this._importNodeStructure(value, childNode, expandAll))
      }
    }
    rootNode.childNodes = childNodes

    if (expandAll && rootNode.expandable) {
      rootNode.expand()
    }

    for (let childNode of childNodes) {
      childNode.parentNode = rootNode
    }

    return rootNode
  }

  // This will import the nodeData
  // JSON creating MissionNode objects
  // from it.
  _importNodeData(nodeData: Array<AnyObject>): void {
    try {
      this.nodes.clear()

      // Converts raw node data into MissionNode
      // objects, then it stores the created
      // objects in the nodeData map.
      for (let nodeDatum of nodeData) {
        let node: MissionNode = new MissionNode(
          this,
          nodeDatum.nodeID,
          nodeDatum.name,
          nodeDatum.color,
          nodeDatum.preExecutionText,
          nodeDatum.postExecutionSuccessText,
          nodeDatum.postExecutionFailureText,
          nodeDatum.executable,
          nodeDatum.device,
          nodeDatum.actions,
          0,
          0,
        )

        this.nodes.set(node.nodeID, node)
      }
    } catch (error) {
      console.error('Invalid JSON passed to create Mission object.')
      throw error
    }
  }

  // This will convert the data
  // stored in this Mission object
  // back into the nodeStructure JSON,
  // supposedly for saving to the server.
  // Nothing should be passed to this
  // function upon initial call. This
  // function is recursive, and the
  // parameters are internally managed.
  _exportNodeStructure(
    nodeStructure: AnyObject = {},
    rootNode: MissionNode = this.rootNode,
  ): AnyObject {
    let childNodes: Array<MissionNode> = rootNode.childNodes

    for (let childNode of childNodes) {
      if (childNode.hasChildren) {
        nodeStructure[childNode.nodeID] = this._exportNodeStructure(
          {},
          childNode,
        )
      } else {
        nodeStructure[childNode.nodeID] = {}
      }
    }

    return nodeStructure
  }

  // This will convert the data
  // stored in this Mission object
  // back into the nodeData JSON,
  // supposedly for saving to the server.
  _exportNodeData(): Array<AnyObject> {
    return Array.from(this.nodes.values()).map((node) => {
      return {
        nodeID: node.nodeID,
        name: node.name,
        color: node.color,
        preExecutionText: node.preExecutionText,
        postExecutionSuccessText: node.postExecutionSuccessText,
        postExecutionFailureText: node.postExecutionFailureText,
        executable: node.executable,
        device: node.device,
        actions: node.actions.map((action: MissionNodeAction) =>
          action.toJSON(),
        ),
      }
    })
  }

  // This will convert this mission into
  // JSON that can't sent to the server.
  toJSON(): IMissionJSON {
    return {
      missionID: this.missionID,
      name: this.name,
      versionNumber: this.versionNumber,
      live: this.live,
      initialResources: this.initialResources,
      seed: this.seed,
      nodeStructure: this.nodeStructure,
      nodeData: this.nodeData,
    }
  }

  // This is called when a change
  // is made to the node structure.
  handleStructureChange(): void {
    this.structureChangeKey = generateHash()

    this.positionNodes()

    for (let handler of this.structureChangeHandlers) {
      handler(this.structureChangeKey)
    }
  }

  // This adds a handler that will
  // be called when a structure change
  // is made.
  addStructureChangeHandler(
    handler: (structureChangeKey: string) => void,
  ): void {
    this.structureChangeHandlers.push(handler)
  }

  // This will remove a structure change
  // handler.
  removeStructureChangeHandler(
    handler: (structureChangeKey: string) => void,
  ): void {
    this.structureChangeHandlers.splice(
      this.structureChangeHandlers.indexOf(handler),
      1,
    )
  }

  // This will remove all structure change
  // handlers.
  clearStructureChangeHandlers(): void {
    this.structureChangeHandlers = []
  }

  // This will create a new node
  // called "New Node" and returns
  // it.
  spawnNewNode(): MissionNode {
    let rootNode: MissionNode = this.rootNode
    let node: MissionNode = new MissionNode(
      this,
      generateHash(),
      'New Node',
      'default',
      'Node has not been executed.',
      'Node has executed successfully.',
      'Node has failed to execute.',
      false,
      false,
      [],
      0,
      0,
    )
    node.parentNode = rootNode
    rootNode.childNodes.push(node)
    rootNode.expand()
    this.nodes.set(node.nodeID, node)

    this.handleStructureChange()

    return node
  }

  // This will position all the nodes
  // with mapX and mapY values that
  // correspond with the current state
  // of the mission.
  positionNodes = (
    parentNode: MissionNode = this.rootNode,
    depth: number = -1,
    rowCount: Counter = new Counter(0),
  ): Mission => {
    // If the parent node isn't the rootNode,
    // then this function was recursively
    // called with a reference to a particular
    // node in the mission. This node should be
    // included in the nodeData for the
    //  missionRender so that it displays.
    if (parentNode.nodeID !== this.rootNode.nodeID) {
      parentNode.mapX = depth
      parentNode.mapY = rowCount.count
    }
    // If the parentNode is expanded, then
    // child nodes could effect the positioning
    // of sibling nodes, and the children should
    // be accounted for.
    if (parentNode.isExpanded) {
      let childNodes = parentNode.childNodes

      // The childNodes should then be examined
      // by recursively calling this function.
      childNodes.forEach((childNode: MissionNode, index: number) => {
        if (index > 0) {
          rowCount.increment()
        }

        this.positionNodes(childNode, depth + 1, rowCount)
      })
    }

    return this
  }

  // This will create a copy of this
  // Mission.
  clone(
    options: IMissionCloneOptions = {
      method: EMissionCloneMethod.IncludeModifications,
      expandAll: false,
    },
  ): Mission {
    switch (options.method) {
      case EMissionCloneMethod.LikeOriginal:
        return new Mission(
          this.missionID,
          this.name,
          this.versionNumber,
          this.live,
          this.initialResources,
          this._originalNodeStructure,
          this._originalNodeData,
          this.seed,
          options.expandAll === true,
        )
        break
      case EMissionCloneMethod.IncludeModifications:
        return new Mission(
          this.missionID,
          this.name,
          this.versionNumber,
          this.live,
          this.initialResources,
          this._exportNodeStructure(),
          this._exportNodeData(),
          this.seed,
          options.expandAll === true,
        )
        break
    }
  }
}

// This will create a brand new mission.
export function createMission(
  mission: Mission,
  expandAll: boolean,
  callback: (mission: Mission) => void,
  callbackError: (error: AxiosError) => void = () => {},
): void {
  axios
    .post(`/api/v1/missions/`, { mission: mission.toJSON() })
    .then((response: AxiosResponse<AnyObject>): void => {
      let missionJson = response.data.mission

      let mission = new Mission(
        missionJson.missionID,
        missionJson.name,
        missionJson.versionNumber,
        missionJson.live,
        missionJson.initialResources,
        missionJson.nodeStructure,
        missionJson.nodeData,
        missionJson.seed,
        expandAll,
      )

      callback(mission)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to save mission.')
      console.error(error)
      callbackError(error)
    })
}

// This gets the data from the database
// and creates a specific mission based
// on the data it returns
export function getMission(
  callback: (mission: Mission) => void,
  callbackEditMission: (mission: Mission) => void,
  callbackError: (error: AxiosError) => void = () => {},
  selectedMissionIDValue: string,
): void {
  axios
    .get(`/api/v1/missions?missionID=${selectedMissionIDValue}`)
    .then((response: AxiosResponse<AnyObject>): void => {
      let missionJson = response.data.mission

      let mission = new Mission(
        missionJson.missionID,
        missionJson.name,
        missionJson.versionNumber,
        missionJson.live,
        missionJson.initialResources,
        missionJson.nodeStructure,
        missionJson.nodeData,
        missionJson.seed,
        false,
      )
      callback(mission)

      callbackEditMission(
        mission.clone({
          method: EMissionCloneMethod.LikeOriginal,
          expandAll: true,
        }),
      )
    })
    .catch((error: AxiosError) => {
      console.error('Failed to retrieve mission.')
      console.error(error)
      callbackError(error)
    })
}

export function getAllMissions(
  callback: (missions: Array<Mission>) => void,
  callbackError: (error: AxiosError) => void = () => {},
): void {
  axios
    .get(`/api/v1/missions/`)
    .then((response: AxiosResponse<AnyObject>): void => {
      let missionsJson = response.data.missions

      callback(missionsJson)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to retrieve missions.')
      console.error(error)
      callbackError(error)
    })
}

// This will save the given mission
// to the server.
export function saveMission(
  mission: Mission,
  callback: () => void,
  callbackError: (error: Error) => void,
): void {
  axios
    .put(`/api/v1/missions/`, { mission: mission.toJSON() })
    .then(callback)
    .catch((error: AxiosError) => {
      console.error('Failed to save mission.')
      console.error(error)
      callbackError(error)
    })
}

// This will update the live parameter
// for the given mission to the server.
export function setLive(
  missionID: string,
  isLive: boolean,
  callback: () => void,
  callbackError: (error: Error) => void,
): void {
  axios
    .put(`/api/v1/missions/`, {
      mission: { missionID: missionID, live: isLive },
    })
    .then(callback)
    .catch((error: AxiosError) => {
      console.error('Mission failed to go live.')
      console.error(error)
      callbackError(error)
    })
}

// This will delete the mission with
// the given missionID.
export function copyMission(
  originalID: string,
  copyName: string,
  callback: (copy: Mission) => void,
  callbackError: (error: Error) => void,
): void {
  axios
    .put(`/api/v1/missions/copy/`, { originalID, copyName })
    .then((response: AxiosResponse<AnyObject>) => {
      let missionJson = response.data.copy

      let copy = new Mission(
        missionJson.missionID,
        missionJson.name,
        missionJson.versionNumber,
        missionJson.live,
        missionJson.initialResources,
        missionJson.nodeStructure,
        missionJson.nodeData,
        missionJson.seed,
        false,
      )

      callback(copy)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to copy mission.')
      console.error(error)
      callbackError(error)
    })
}

// This will delete the mission with
// the given missionID.
export function deleteMission(
  missionID: string,
  callback: () => void,
  callbackError: (error: Error) => void,
): void {
  axios
    .delete(`/api/v1/missions?missionID=${missionID}`)
    .then(callback)
    .catch((error: AxiosError) => {
      console.error('Failed to delete mission.')
      console.error(error)
      callbackError(error)
    })
}

export default {
  Mission,
  createMission,
  getMission,
  getAllMissions,
  saveMission,
  setLive,
  deleteMission,
}
