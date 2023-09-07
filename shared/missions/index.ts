import { Counter } from 'metis/toolbox/numbers'
import seedrandom, { PRNG } from 'seedrandom'
import { v4 as generateHash } from 'uuid'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { AnyObject } from 'metis/toolbox/objects'
import MissionNode, {
  ENodeTargetRelation,
  IMissionNodeJSON as IMissionNodeJSON,
  MissionNodeCreator,
} from 'metis/missions/nodes'
import { IConsoleOutput } from 'metis/console'
import { IUserJSON } from 'metis/users'

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
  introMessage: string
  versionNumber: number
  live: boolean
  initialResources: number
  seed: string
  nodeStructure: AnyObject
  nodeData: Array<IMissionNodeJSON>
}

/**
 * Options when fetching a mission.
 */
export interface IMissionFetchOptions {
  /**
   * Whether or not to open all nodes of the new Mission object. Defaults to false.
   */
  openAllNodes?: boolean
}

/**
 * JSON representation of BaseMissionSession class.
 */
export interface IMissionSessionJSON {
  mission: IMissionJSON
  participants: Array<IUserJSON>
}

// This is a config that can be passed
// when cloning a mission to configure
// how you want this mission to be cloned.
export interface IMissionCloneOptions {
  method: EMissionCloneMethod
  openAll?: boolean
}

/**
 * Represents a piece of data that can displayed as a node on a mission map.
 */
export interface IMissionMappable {
  nodeID: string
  name: string
  mapX: number
  mapY: number
  depth: number
  executing: boolean
  executable: boolean
  executionPercentCompleted: number
  device: boolean
  color: string
  isOpen: boolean
  childNodes: Array<MissionNode>
}

// This represents a mission for a
// student to complete.
export default class Mission {
  missionID: string
  name: string
  introMessage: string
  versionNumber: number
  live: boolean
  initialResources: number
  resources: number
  _originalNodeStructure: AnyObject
  _originalNodeData: Array<IMissionNodeJSON>
  nodes: Map<string, MissionNode>
  seed: string
  rng: PRNG
  rootNode: MissionNode

  lastOpenedNode: MissionNode | null
  _lastCreatedNode: MissionNode | null
  structureChangeKey: string
  structureChangeHandlers: Array<(structureChangeKey: string) => void>
  disableNodes: boolean
  _depth: number
  _nodeCreationTarget: MissionNode | null
  _nodeCreators: Array<MissionNodeCreator>
  consoleOutputs: Array<IConsoleOutput>
  _hasDisabledNodes: boolean

  // This will return the node
  // structure for the mission,
  // updating it if the mission
  // has been modified.
  get nodeStructure(): AnyObject {
    return this._exportNodeStructure(false)
  }

  // This will return the node
  // data for the mission,
  // updating it if the mission
  // has been modified.
  get nodeData(): Array<IMissionNodeJSON> {
    return this._exportNodeData(false)
  }

  // Getter for _lastCreatedNode.
  get lastCreatedNode(): MissionNode | null {
    return this._lastCreatedNode
  }

  // Getter for _depth.
  get depth(): number {
    return this._depth
  }

  // Getter for _nodeCreationTarget.
  get nodeCreationTarget(): MissionNode | null {
    return this._nodeCreationTarget
  }

  // Setter for _nodeCreationTarget.
  set nodeCreationTarget(nodeCreationTarget: MissionNode | null) {
    this._nodeCreationTarget = nodeCreationTarget
    this._nodeCreators = []

    if (nodeCreationTarget !== null) {
      this._nodeCreators.push(
        new MissionNodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.ParentOfTargetOnly,
          0,
          0,
        ),
      )
      this._nodeCreators.push(
        new MissionNodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.BetweenTargetAndChildren,
          0,
          0,
        ),
      )
      this._nodeCreators.push(
        new MissionNodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.PreviousSiblingOfTarget,
          0,
          0,
        ),
      )
      this._nodeCreators.push(
        new MissionNodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.FollowingSiblingOfTarget,
          0,
          0,
        ),
      )
    }

    this.handleStructureChange()
  }

  // Getter for _nodeCreators.
  get nodeCreators(): Array<MissionNodeCreator> {
    return this._nodeCreators
  }

  get hasDisabledNodes(): boolean {
    return this._hasDisabledNodes
  }

  set hasDisabledNodes(hasDisabledNodes: boolean) {
    this._hasDisabledNodes = hasDisabledNodes
  }

  constructor(
    missionID: string,
    name: string,
    introMessage: string,
    versionNumber: number,
    live: boolean,
    initialResources: number,
    nodeStructure: AnyObject,
    nodeData: Array<IMissionNodeJSON>,
    seed: string,
    openAll: boolean = false,
  ) {
    this.missionID = missionID
    this.name = name
    this.introMessage = introMessage
    this.versionNumber = versionNumber
    this.live = live
    this.initialResources = initialResources
    this.resources = initialResources
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
      'Description goes here',
      'N/A',
      0,
      false,
      false,
      [],
      0,
      0,
    )
    this.lastOpenedNode = null
    this._lastCreatedNode = null
    this.structureChangeKey = generateHash()
    this.structureChangeHandlers = []
    this.disableNodes = false
    this._depth = -1
    this._nodeCreationTarget = null
    this._nodeCreators = []
    this.consoleOutputs = []
    this._hasDisabledNodes = false

    this._importNodeData(nodeData)
    this._importNodeStructure(nodeStructure, this.rootNode, openAll)

    if (this.nodes.size === 0) {
      this.spawnNewNode()
    }

    if (this.rootNode.hasChildren) {
      this.rootNode.open()
    } else {
      this.positionNodes()
    }
  }

  // This will determine the relationship
  // between nodes, parent to child and
  // vice versa.
  _importNodeStructure(
    nodeStructure: AnyObject,
    rootNode: MissionNode = this.rootNode,
    openAll: boolean = false,
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
        childNodes.push(this._importNodeStructure(value, childNode, openAll))
      }
    }
    rootNode.childNodes = childNodes

    if (openAll && rootNode.hasChildren) {
      rootNode.open()
    }

    for (let childNode of childNodes) {
      childNode.parentNode = rootNode
    }

    return rootNode
  }

  // This will import the nodeData
  // JSON creating MissionNode objects
  // from it.
  _importNodeData(nodeData: Array<IMissionNodeJSON>): void {
    try {
      this.nodes.clear()

      // Converts raw node data into MissionNode
      // objects, then it stores the created
      // objects in the nodeData map.
      for (let nodeDatum of nodeData) {
        let defaultNodeDatum = {
          name: MissionNode.default_name,
          color: MissionNode.default_color,
          description: MissionNode.default_description,
          preExecutionText: MissionNode.default_preExecutionText,
          depthPadding: MissionNode.default_depthPadding,
          executable: MissionNode.default_executable,
          device: MissionNode.default_device,
          actions: MissionNode.default_actions,
        }

        nodeDatum = { ...defaultNodeDatum, ...nodeDatum }

        let node: MissionNode = new MissionNode(
          this,
          nodeDatum.nodeID,
          nodeDatum.name,
          nodeDatum.color,
          nodeDatum.description,
          nodeDatum.preExecutionText,
          nodeDatum.depthPadding,
          nodeDatum.executable,
          nodeDatum.device,
          nodeDatum.actions,
          MissionNode.default_mapX,
          MissionNode.default_mapY,
          nodeDatum.isOpen,
        )

        this.nodes.set(node.nodeID, node)
      }
    } catch (error) {
      console.error('Invalid JSON passed to create Mission object.')
      throw error
    }
  }

  /**
   * This will convert the data stored in this Mission object back into the node structure JSON, supposedly for saving to the server. Nothing should be passed to this function upon initial call. This function is recursive, and the parameters are internally managed.
   * @param {boolean} excludeHidden Whether or not to exclude hidden nodes from the exported node structure. Defaults to false.
   * @param {AnyObject} nodeStructure Ignore this. Do not pass a value. This is recursively used by the function itself.
   * @param {MissionNode} rootNode  Ignore this. Do not pass a value. This is recursively used by the function itself.
   * @returns {AnyObject} The node structure JSON.
   */
  _exportNodeStructure(
    excludeHidden: boolean,
    nodeStructure: AnyObject = {},
    rootNode: MissionNode = this.rootNode,
  ): AnyObject {
    let childNodes: Array<MissionNode> = rootNode.childNodes

    if (!excludeHidden || rootNode.isOpen) {
      for (let childNode of childNodes) {
        if (childNode.hasChildren) {
          nodeStructure[childNode.nodeID] = this._exportNodeStructure(
            excludeHidden,
            {},
            childNode,
          )
        } else {
          nodeStructure[childNode.nodeID] = {}
        }
      }
    }

    return nodeStructure
  }

  /**
   * This will convert the data stored in this Mission object back into the nodeData JSON, supposedly for saving to the server.
   * @param excludeHidden - If true, this will exclude nodes with a closed parent node.
   * @returns {Array<IMissionNodeJSON>} - The nodeData JSON.
   */
  _exportNodeData(excludeHidden: boolean): Array<IMissionNodeJSON> {
    // Create an array of the MissionNode
    // objects from the nodes map.
    let nodes: Array<MissionNode> = Array.from(this.nodes.values())

    // If excludeHidden is true, filter
    // out nodes with a closed parent node.
    if (excludeHidden) {
      nodes = nodes.filter(
        (node: MissionNode) =>
          node.parentNode === null || node.parentNode.isOpen,
      )
    }

    // Convert the MissionNode objects
    // into JSON and return the result.
    return nodes.map((node) => node.toJSON())
  }

  // This will convert this mission into
  // JSON that can't sent to the server.
  toJSON(excludeHidden: boolean = false): IMissionJSON {
    return {
      missionID: this.missionID,
      name: this.name,
      introMessage: this.introMessage,
      versionNumber: this.versionNumber,
      live: this.live,
      initialResources: this.initialResources,
      seed: this.seed,
      nodeStructure: this._exportNodeStructure(excludeHidden),
      nodeData: this._exportNodeData(excludeHidden),
    }
  }

  // This is called when a change
  // is made to the node structure.
  handleStructureChange(): void {
    this.structureChangeKey = generateHash()

    this.positionNodes()

    if (this.nodeCreationTarget !== null) {
      this.positionNodeCreators()
    }

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
      MissionNode.default_color,
      MissionNode.default_description,
      MissionNode.default_preExecutionText,
      MissionNode.default_depthPadding,
      MissionNode.default_executable,
      MissionNode.default_device,
      MissionNode.default_actions,
      MissionNode.default_mapX,
      MissionNode.default_mapY,
      true,
    )
    node.parentNode = rootNode
    rootNode.childNodes.push(node)
    this.nodes.set(node.nodeID, node)
    this._lastCreatedNode = node

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
    let nodeCreationTarget: MissionNode | null = this.nodeCreationTarget

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
    // Else the depth of the mission is reset
    // for recalculation.
    else {
      this._depth = -1
    }

    parentNode.depth = depth

    // If the nodeCreationTarget is this parentNode,
    // the positioning is offset to account for the
    // node creators that must be rendered.
    if (nodeCreationTarget?.nodeID === parentNode.nodeID) {
      depth++
    }

    // If the parentNode is expanded, then
    // child nodes could effect the positioning
    // of sibling nodes, and the children should
    // be accounted for.
    if (parentNode.isOpen) {
      let childNodes = parentNode.childNodes

      // If the nodeCreationTarget is a child of the
      // parentNode, the positioning is offset to account
      // for the node creators that must be rendered.
      for (let childNode of childNodes) {
        if (nodeCreationTarget?.nodeID === childNode.nodeID) {
          depth += 1
        }
      }

      // The childNodes should then be examined
      // by recursively calling this function.
      childNodes.forEach((childNode: MissionNode, index: number) => {
        if (index > 0) {
          rowCount.increment()
        }

        // If the nodeCreationTarget is this childNode,
        // the positioning is offset to account for the
        // node creators that must be rendered.
        if (nodeCreationTarget?.nodeID === childNode.nodeID) {
          rowCount.increment()
        }

        this.positionNodes(
          childNode,
          depth + 1 + childNode.depthPadding,
          rowCount,
        )

        // If the nodeCreationTarget is this childNode,
        // the positioning is offset to account for the
        // node creators that must be rendered.
        if (nodeCreationTarget?.nodeID === childNode.nodeID) {
          rowCount.increment()
        }
      })
    }

    // This will increase the mission depth
    // if a node is found with a greater depth
    // than what's currently set.
    if (this._depth < depth) {
      this._depth = depth
    }

    return this
  }

  // This will position all the nodes
  // creators with mapX and mapY values that
  // correspond with the current state
  // of the mission.
  positionNodeCreators = (): void => {
    let nodeCreationTarget: MissionNode | null = this.nodeCreationTarget
    let nodeCreators: Array<MissionNodeCreator> = this.nodeCreators

    if (nodeCreationTarget !== null) {
      for (let nodeCreator of nodeCreators) {
        switch (nodeCreator.creationTargetRelation) {
          case ENodeTargetRelation.ParentOfTargetAndChildren:
            nodeCreator.mapX = nodeCreationTarget.mapX - 2
            nodeCreator.mapY = nodeCreationTarget.mapY
            nodeCreator.depth = nodeCreationTarget.depth - 2
            break
          case ENodeTargetRelation.ParentOfTargetOnly:
            nodeCreator.mapX = nodeCreationTarget.mapX - 1
            nodeCreator.mapY = nodeCreationTarget.mapY
            nodeCreator.depth = nodeCreationTarget.depth - 1
            break
          case ENodeTargetRelation.BetweenTargetAndChildren:
            nodeCreator.mapX = nodeCreationTarget.mapX + 1
            nodeCreator.mapY = nodeCreationTarget.mapY
            nodeCreator.depth = nodeCreationTarget.depth + 1
            break
          case ENodeTargetRelation.PreviousSiblingOfTarget:
            nodeCreator.mapX = nodeCreationTarget.mapX
            nodeCreator.mapY = nodeCreationTarget.mapY - 1
            nodeCreator.depth = nodeCreationTarget.depth
            break
          case ENodeTargetRelation.FollowingSiblingOfTarget:
            nodeCreator.mapX = nodeCreationTarget.mapX
            nodeCreator.mapY = nodeCreationTarget.mapY + 1
            nodeCreator.depth = nodeCreationTarget.depth
            break
        }
      }
    }
  }

  outputToConsole = (consoleOutput: IConsoleOutput): void => {
    this.consoleOutputs.push(consoleOutput)
  }

  // This will create a copy of this
  // Mission.
  clone(
    options: IMissionCloneOptions = {
      method: EMissionCloneMethod.IncludeModifications,
      openAll: false,
    },
  ): Mission {
    switch (options.method) {
      case EMissionCloneMethod.LikeOriginal:
        return new Mission(
          this.missionID,
          this.name,
          this.introMessage,
          this.versionNumber,
          this.live,
          this.initialResources,
          this._originalNodeStructure,
          this._originalNodeData,
          this.seed,
          options.openAll === true,
        )
        break
      case EMissionCloneMethod.IncludeModifications:
        return new Mission(
          this.missionID,
          this.name,
          this.introMessage,
          this.versionNumber,
          this.live,
          this.initialResources,
          this._exportNodeStructure(false),
          this._exportNodeData(false),
          this.seed,
          options.openAll === true,
        )
        break
    }
  }

  // This will enable all nodes
  // that have been disabled.
  enableAllNodes = (): void => {
    this.nodes.forEach((node: MissionNode) => {
      node.highlighted = true
    })
    this.hasDisabledNodes = false
  }

  /**
   * The API endpoint for mission data on the METIS server.
   */
  public static API_ENDPOINT: string = `/api/v1/missions`

  /**
   * The API endpoint for mission execution operations on the METIS server.
   */
  public static API_EXECUTE_URL: string = `${Mission.API_ENDPOINT}/execute`

  /**
   * Converts IMissionJSON into a Mission object.
   * @param {IMissionJson} json The json to be converted.
   * @returns {Mission} The Mission object.
   */
  public static fromJSON(json: IMissionJSON): Mission {
    return new Mission(
      json.missionID,
      json.name,
      json.introMessage,
      json.versionNumber,
      json.live,
      json.initialResources,
      json.nodeStructure,
      json.nodeData,
      json.seed,
    )
  }

  /**
   * Calls the API to fetch one mission by its mission ID.
   * @param {string} missionID The ID of the mission to fetch.
   * @param {object} options Options for the fetch operation.
   * @returns {Promise<Mission>} A promise that resolves to a Mission object.
   */
  public static async fetchOne(
    missionID: string,
    options: { openAllNodes?: boolean } = {},
  ): Promise<Mission> {
    return new Promise<Mission>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: missionJSON } = await axios.get<IMissionJSON>(
          `${Mission.API_ENDPOINT}`,
          { params: { missionID } },
        )
        // Convert JSON to Mission object.
        let mission: Mission = new Mission(
          missionJSON.missionID,
          missionJSON.name,
          missionJSON.introMessage,
          missionJSON.versionNumber,
          missionJSON.live,
          missionJSON.initialResources,
          missionJSON.nodeStructure,
          missionJSON.nodeData,
          missionJSON.seed,
          options.openAllNodes === true,
        )
        // Resolve
        resolve(mission)
      } catch (error) {
        console.error('Failed to fetch mission.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to fetch all missions available.
   * @returns {Promise<Array<Mission>>} A promise that resolves to an array of Mission objects.
   */
  public static async fetchAll(): Promise<Array<Mission>> {
    return new Promise<Array<Mission>>(async (resolve, reject) => {
      try {
        let { data: missionsJSON } = await axios.get<Array<IMissionJSON>>(
          Mission.API_ENDPOINT,
        )
        resolve(
          missionsJSON.map((missionJSON) => {
            missionJSON.nodeData = []
            missionJSON.nodeStructure = {}
            return Mission.fromJSON(missionJSON)
          }),
        )
      } catch (error) {
        console.error('Failed to fetch missions.')
        console.error(error)
        reject(error)
      }
    })
  }
}

// This will create a brand new mission.
export function createMission(
  mission: Mission,
  openAll: boolean,
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
        missionJson.introMessage,
        missionJson.versionNumber,
        missionJson.live,
        missionJson.initialResources,
        missionJson.nodeStructure,
        missionJson.nodeData,
        missionJson.seed,
        openAll,
      )

      callback(mission)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to save mission.')
      console.error(error)
      callbackError(error)
    })
}

// This will import a .metis file
// to the server to create a new
// mission.
export function importMissions(
  files: FileList | Array<File>,
  openAll: boolean,
  callback: (
    successfulImportCount: number,
    failedImportCount: number,
    errorMessages: Array<{ fileName: string; errorMessage: string }>,
  ) => void,
  callbackError: (error: AxiosError) => void = () => {},
): void {
  const formData = new FormData()

  for (let file of files) {
    formData.append('files', file)
  }

  axios
    .post(`/api/v1/missions/import/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((response: AxiosResponse<AnyObject>): void => {
      let successfulImportCount: number = response.data.successfulImportCount
      let failedImportCount: number = response.data.failedImportCount
      let failedImportErrorMessages: Array<{
        fileName: string
        errorMessage: string
      }> = response.data.failedImportErrorMessages

      callback(
        successfulImportCount,
        failedImportCount,
        failedImportErrorMessages,
      )
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
  missionID: string,
  callback: (mission: Mission) => void,
  callbackError: (error: AxiosError) => void = () => {},
  options: { openAllNodes?: boolean } = {},
): void {
  axios
    .get(`/api/v1/missions?missionID=${missionID}`)
    .then((response: AxiosResponse<AnyObject>): void => {
      let missionJson = response.data.mission

      let mission = new Mission(
        missionJson.missionID,
        missionJson.name,
        missionJson.introMessage,
        missionJson.versionNumber,
        missionJson.live,
        missionJson.initialResources,
        missionJson.nodeStructure,
        missionJson.nodeData,
        missionJson.seed,
        options.openAllNodes === true,
      )
      callback(mission)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to retrieve mission.')
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

// This will copy the mission with
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
        missionJson.introMessage,
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
