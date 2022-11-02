import { Counter } from './numbers'
import { AnyObject } from 'mongoose'
import seedrandom, { PRNG } from 'seedrandom'
import { v4 as generateHash } from 'uuid'
import axios, { AxiosError, AxiosResponse } from 'axios'

// This is an enum used by the
// MissionNode move
// function to describe the
// purpose of the target
// property past.
export enum ENodeTargetRelation {
  Parent,
  PreviousSibling,
  FollowingSibling,
}

// This is the raw mission data returned
// from the server used to create instances
// of the Mission class.
export interface IMissionJson {
  name: string
  versionNumber: number
  seed: number
  nodeStructure: AnyObject
  nodeData: Array<AnyObject>
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
  mission: Mission
  actionID: string
  name: string
  description: string
  processTime: number
  successChance: number
  _willSucceed: boolean

  // Getter for _willSucceed
  get willSucceed(): boolean {
    return this._willSucceed
  }

  constructor(
    mission: Mission,
    actionID: string,
    name: string,
    description: string,
    processTime: number,
    successChance: number,
  ) {
    this.mission = mission
    this.actionID = actionID
    this.name = name
    this.description = description
    this.processTime = processTime
    this.successChance = successChance
    this._willSucceed = MissionNodeAction.determineActionSuccess(
      successChance,
      mission.rng,
    )
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

// This represents an individual node
// for a student to execute within a
// mission.
export class MissionNode {
  mission: Mission
  nodeID: string
  name: string
  parentNode: MissionNode | null
  childNodes: Array<MissionNode>
  color: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  executable: boolean
  actions: Array<MissionNodeAction>
  selectedAction: MissionNodeAction | null
  _executed: boolean
  _executing: boolean
  mapX: number
  mapY: number
  _isExpanded: boolean

  get willSucceed(): boolean {
    let willSucceed: boolean = false
    let selectedAction: MissionNodeAction | null = this.selectedAction

    if (selectedAction !== null) {
      willSucceed = selectedAction.willSucceed
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

    if (this.selectedAction !== null) {
      successChance = this.selectedAction.successChance
    }

    return successChance
  }

  constructor(
    mission: Mission,
    nodeID: string,
    name: string,
    color: string,
    preExecutionText: string,
    postExecutionSuccessText: string,
    postExecutionFailureText: string,
    actionData: string,
    executable: boolean,
    actions: Array<MissionNodeAction>,
    mapX: number,
    mapY: number,
  ) {
    this.mission = mission
    this.nodeID = nodeID
    this.name = name
    this.parentNode = null
    this.childNodes = []
    this.color = color
    this.preExecutionText = preExecutionText
    this.postExecutionSuccessText = postExecutionSuccessText
    this.postExecutionFailureText = postExecutionFailureText
    this.actionData = actionData
    this.executable = executable
    this.actions = actions
    this.selectedAction = null
    this._executed = false
    this._executing = false
    this.mapX = mapX
    this.mapY = mapY
    this._isExpanded = false
  }

  // This will execute the selected
  // node action after the time delay
  // of the selected node action.
  execute(callback: (success: boolean) => void): void {
    let selectedAction: MissionNodeAction | null = this.selectedAction

    if (
      this.executable === true &&
      this.executed === false &&
      selectedAction !== null
    ) {
      this._executing = true

      // If a node is being executed then this disables all the nodes
      // while the node is being executed.
      if (this.executing) {
        this.mission._disableNodes = true
      }

      setTimeout(() => {
        this._executing = false
        this._executed = true

        // Enables all the nodes after the selected node is done executing.
        this.mission._disableNodes = false

        callback(this.willSucceed)
      }, selectedAction.processTime)
    }
  }

  // This is called when a change
  // is made to the node structure.
  _handleStructureChange(): void {
    this.mission.handleStructureChange()
  }

  get siblings(): Array<MissionNode> {
    let siblings: Array<MissionNode> = []

    if (this.parentNode !== null) {
      let childrenOfParent: Array<MissionNode> = this.parentNode.childNodes

      siblings = childrenOfParent.filter(
        (childOfParent: MissionNode) => childOfParent.nodeID !== this.nodeID,
      )
    }

    return siblings
  }

  get childrenOfParent(): Array<MissionNode> {
    let childrenOfParent: Array<MissionNode> = []

    if (this.parentNode !== null) {
      childrenOfParent = this.parentNode.childNodes
    }

    return childrenOfParent
  }

  get previousSibling(): MissionNode | null {
    let previousSibling: MissionNode | null = null

    if (this.parentNode !== null) {
      let childrenOfParent: Array<MissionNode> = this.parentNode.childNodes

      childrenOfParent.forEach((childOfParent: MissionNode, index: number) => {
        if (childOfParent.nodeID === this.nodeID && index > 0) {
          previousSibling = childrenOfParent[index - 1]
        }
      })
    }

    return previousSibling
  }

  get followingSibling(): MissionNode | null {
    let followingSibling: MissionNode | null = null

    if (this.parentNode !== null) {
      let childrenOfParent: Array<MissionNode> = this.parentNode.childNodes

      childrenOfParent.forEach((childOfParent: MissionNode, index: number) => {
        if (
          childOfParent.nodeID === this.nodeID &&
          index + 1 < childrenOfParent.length
        ) {
          followingSibling = childrenOfParent[index + 1]
        }
      })
    }

    return followingSibling
  }

  get isExpanded(): boolean {
    return this._isExpanded
  }

  get isCollapsed(): boolean {
    return !this._isExpanded
  }

  get expandable(): boolean {
    return this.childNodes.length > 0
  }

  // This will mark this reference
  // as expanded if possible.
  expand(): void {
    if (this.expandable) {
      this._isExpanded = true
      this._handleStructureChange()
    } else {
      throw new Error(`Cannot expand ${this.nodeID} as it has no childNodes:`)
    }
  }

  // This will mark this reference
  // as collapsed if possible.
  collapse(): void {
    if (this.expandable) {
      this._isExpanded = false
      this._handleStructureChange()
    } else {
      throw new Error(`Cannot collapse ${this.nodeID} as it has no childNodes:`)
    }
  }

  // This will toggle between expanded
  // and collapse if possible.
  toggle(): void {
    if (this.isExpanded) {
      this.collapse()
    } else {
      this.expand()
    }
  }

  // This will move this reference to
  // a new location relative to the target
  // and relation this target has to the
  // destination.
  move(target: MissionNode, targetRelation: ENodeTargetRelation): void {
    let rootNode: MissionNode = this.mission.rootNode
    let parentNode: MissionNode | null = this.parentNode
    let newParentNode: MissionNode | null = target.parentNode
    let newParentNodeChildNodes: Array<MissionNode> = []

    // This makes sure that the target
    // isn't being moved inside or beside
    // itself.
    let x: MissionNode | null = target

    while (x !== null && x.nodeID !== rootNode.nodeID) {
      if (this.nodeID === x.nodeID) {
        return
      }

      x = x.parentNode
    }

    // This will remove the nodes
    // current position in the structure.
    if (parentNode !== null) {
      let siblings: MissionNode[] = parentNode.childNodes

      for (let index: number = 0; index < siblings.length; index++) {
        let sibling = siblings[index]

        if (this.nodeID === sibling.nodeID) {
          siblings.splice(index, 1)
        }
      }
    }

    // This will
    switch (targetRelation) {
      case ENodeTargetRelation.Parent:
        target.childNodes.push(this)
        this.parentNode = target
        break
      case ENodeTargetRelation.PreviousSibling:
        if (newParentNode !== null) {
          newParentNode.childNodes.forEach((childNode: MissionNode) => {
            newParentNodeChildNodes.push(childNode)

            if (childNode.nodeID === target.nodeID) {
              newParentNodeChildNodes.push(this)
              this.parentNode = newParentNode
            }
          })

          newParentNode.childNodes = newParentNodeChildNodes
        }
        break
      case ENodeTargetRelation.FollowingSibling:
        if (newParentNode !== null) {
          newParentNode.childNodes.forEach((childNode: MissionNode) => {
            if (childNode.nodeID === target.nodeID) {
              newParentNodeChildNodes.push(this)
              this.parentNode = newParentNode
            }

            newParentNodeChildNodes.push(childNode)
          })

          newParentNode.childNodes = newParentNodeChildNodes
        }
        break
    }

    this._handleStructureChange()
  }

  // This will expand all child nodes
  // of this node if possible.
  expandChildNodes(): void {
    for (let childNode of this.childNodes) {
      if (childNode.expandable) {
        childNode.expand()
      }
    }

    this._handleStructureChange()
  }

  // This will color all descendant
  // nodes the same color as this
  // node.
  applyColorFill(): void {
    for (let childNode of this.childNodes) {
      childNode.color = this.color
      childNode.applyColorFill()
    }
  }
}

// This represents a mission for a
// student to complete.
export class Mission {
  missionID: string
  name: string
  versionNumber: number
  nodeStructure: AnyObject
  nodeData: Array<AnyObject>
  nodes: Map<string, MissionNode>
  seed: string
  rng: PRNG
  rootNode: MissionNode
  structureChangeKey: string
  structureChangeHandlers: Array<(structureChangeKey: string) => void>
  _disableNodes: boolean

  get disableNodes(): boolean {
    return this._disableNodes
  }

  constructor(
    missionID: string,
    name: string,
    versionNumber: number,
    nodeStructure: AnyObject,
    nodeData: Array<AnyObject>,
    seed: string,
    expandAll: boolean = false,
  ) {
    this.missionID = missionID
    this.name = name
    this.versionNumber = versionNumber
    this.nodeStructure = nodeStructure
    this.nodeData = nodeData
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
      'N/A',
      false,
      [],
      0,
      0,
    )
    this.structureChangeKey = generateHash()
    this.structureChangeHandlers = []
    this._disableNodes = false

    this.parseJSON()
    this.mapNodeRelationships(expandAll, this.rootNode, nodeStructure)
    // Calling this runs positionNodes.
    // Without this line, positionNodes
    // needs to be called independently.
    this.rootNode.expand()
  }

  parseJSON(): void {
    try {
      let nodeData: Array<AnyObject> = this.nodeData

      this.nodes.clear()

      // Converts raw node data into MissionNode
      // objects, then it stores the created
      // objects in the nodeData map.
      for (let nodeDatum of nodeData) {
        let actions = []

        for (let action of nodeDatum.actions) {
          let nodeAction: MissionNodeAction = new MissionNodeAction(
            this,
            action.actionID,
            action.name,
            action.description,
            action.processTime,
            action.successChance,
          )
          actions.push(nodeAction)
        }

        let node: MissionNode = new MissionNode(
          this,
          nodeDatum.nodeID,
          nodeDatum.name,
          nodeDatum.color,
          nodeDatum.preExecutionText,
          nodeDatum.postExecutionSuccessText,
          nodeDatum.postExecutionFailureText,
          nodeDatum.actionData,
          nodeDatum.executable,
          actions,
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
      '',
      true,
      [],
      0,
      0,
    )
    node.parentNode = rootNode
    rootNode.childNodes.push(node)

    this.handleStructureChange()

    return node
  }

  // This will determine the relationship
  // between nodes, parent to child and
  // vise-versa.
  mapNodeRelationships(
    expandAll: boolean = false,
    rootNode: MissionNode = this.rootNode,
    nodeStructure: AnyObject = this.nodeStructure,
  ): MissionNode {
    let nodes: Map<string, MissionNode> = this.nodes
    let childNodes: Array<MissionNode> = []
    let childNodeKeyValuePairs: Array<[string, AnyObject | string]> =
      Object.keys(nodeStructure).map((key: string) => [key, nodeStructure[key]])

    for (let childNodeKeyValuePair of childNodeKeyValuePairs) {
      let key: string = childNodeKeyValuePair[0]
      let value: AnyObject | string = childNodeKeyValuePair[1]
      let childNode: MissionNode | undefined = nodes.get(key)

      if (typeof value !== 'string' && childNode !== undefined) {
        childNodes.push(this.mapNodeRelationships(expandAll, childNode, value))
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

  // This will position all the nodes
  // with mapX and mapY values that
  // correspond with the current state
  // of the mission.
  positionNodes = (
    parentNode: MissionNode = this.rootNode,
    depth: number = -1,
    rowCount: Counter = new Counter(0),
  ): Mission => {
    // Else, this function was recursively
    // called with a reference to a particular
    // node in the mission. This node should be
    // included in the nodeData for the missionRender
    // so that it displays.
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
}

// ! TO-BE-REMOVED
// This creates a test mission for
// testing purposes.
export function createTestMission(expandAll: boolean = false): Mission {
  const testMissionJson = {
    missionID: '636177fb5e82600adaed8bd4',
    name: 'Incredible Mission',
    versionNumber: 1,
    seed: '980238470934',
    nodeStructure: {
      '1': {
        '2': { '3': { '4': { END: 'END' } } },
        '5': { '6': { '7': { END: 'END' } } },
        '8': { '9': { '10': { END: 'END' } } },
        '11': { '12': { '13': { END: 'END' } } },
      },
      '14': {
        '15': { '16': { '17': { END: 'END' }, '18': { END: 'END' } } },
      },
      '19': {
        '20': { '21': { END: 'END' }, '22': { END: 'END' } },
        '23': { '24': { END: 'END' } },
        '25': { '26': { END: 'END' } },
        '27': { '28': { END: 'END' }, '29': { END: 'END' } },
      },
      '30': {
        '31': { END: 'END' },
        '32': { END: 'END' },
        '33': { END: 'END' },
        '34': { END: 'END' },
      },
    },
    nodeData: [
      {
        nodeID: '1',
        name: 'Communications',
        color: 'green',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '29db5000-811e-49c8-a43d-1d946b5fbd89',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '80be986e-13b4-4794-9799-0516edfc01ba',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '5a3acf01-7ea6-48c5-bff8-155233dcf46c',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'fc198adf-830c-46f7-8f0b-42cd301146c7',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '3585b92b-2a0c-4d86-bed6-9ccf2bb95032',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '97b10701-2fde-44a5-b86d-10f1ac8de094',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 0,
        mapY: -3,
      },
      {
        nodeID: '2',
        name: 'Cellular Network',
        color: 'green',
        preExecutionText: 'Cellular Network has not been executed.',
        postExecutionSuccessText: 'Cellular Network succeeded.',
        postExecutionFailureText: 'Cellular Network failed.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: 'd8a4241a-e483-460a-92a9-ef89b347b735',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '576ed1b0-c5b1-46e5-9f79-13c8a8c6e2a2',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '94acd154-e808-4075-86ea-5478fb64e728',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '699c4905-19b2-4a6e-947d-a3eabe7a63ab',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '5e5f89ee-9f60-46c3-a539-69676cac03ea',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'c1964697-45fd-4c13-8c36-299d4e2d8b8a',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: -5,
      },
      {
        nodeID: '5',
        name: 'Internet Provider',
        color: 'green',
        preExecutionText: 'Internet Provider has not been executed.',
        postExecutionSuccessText: 'Internet Provider has been executed.',
        postExecutionFailureText: 'Internet Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: 'efdde98a-d150-4712-8c3f-3781d5726ca5',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '93d45723-6f20-4e37-9d70-93190c9e7a3d',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '0c19922d-55ff-4a97-817e-7bfbac066020',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'd91a98d8-87d9-429d-bdb9-5deacf580227',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '34fc3ea9-7d7d-41dc-bc50-92ab113a2d8e',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '42194bc7-678b-48e6-b5c0-7c09261b3f9a',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: -4,
      },
      {
        nodeID: '8',
        name: 'Instant Messaging',
        color: 'green',
        preExecutionText: 'Instant Messaging has not been executed.',
        postExecutionSuccessText: 'Instant Messaging has been executed.',
        postExecutionFailureText: 'Instant Messaging has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '6cdaca7a-3cee-4ddd-b44b-3415966bf17b',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'c6f07649-8a3d-4dc3-b4ca-2c311615cfe6',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '04da55a5-ceaa-453a-8389-ec97c159912c',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '5d2fc680-20d9-4020-9ccd-8b534b54ca15',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '2f335d63-44b0-4082-88bb-00d12d3b4034',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'ea35a66b-a1c8-4f17-ac94-aef51776e0bf',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: -3,
      },
      {
        nodeID: '11',
        name: 'File Sharing Service',
        color: 'green',
        preExecutionText: 'File Sharing Service has not been executed.',
        postExecutionSuccessText: 'File Sharing Service has been executed.',
        postExecutionFailureText: 'File Sharing Service has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '93aaeb8d-0cfc-49df-9e97-1ee6cc72770a',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'a8b57bb3-75b8-45ae-a554-37f408b3a990',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: 'f5838cd3-5c67-453d-af7f-1ea0764e8667',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '47be6a99-1d56-40e9-ab83-4d38d4325b60',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '4005c9c1-431c-4a4f-9db0-c0a889030f84',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '43d46dee-524c-4521-b10d-f912fa970001',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: -2,
      },
      {
        nodeID: '3',
        name: 'Callbank Cellular',
        color: 'green',
        preExecutionText: 'Callbank Cellular has not been executed.',
        postExecutionSuccessText: 'Callbank Cellular has been executed.',
        postExecutionFailureText: 'Callbank Cellular has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: 'a50cd5ee-490f-45ca-b633-d45818a95bdb',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '613095d4-8f8e-4187-ab94-86a1aed7103a',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: 'caaaf024-bcc2-4907-a9b5-7b8197ddef70',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'd9d2388d-ec53-4b2e-8508-86a66f4c3711',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '76f9c0a3-24d3-4a84-b43f-87444aa0b8a2',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'de33f965-aa6f-4956-aef6-62b2b9b28a57',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 3,
        mapY: -5,
      },
      {
        nodeID: '6',
        name: 'Service Provider',
        color: 'green',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '1c202e10-38d3-4c52-8b51-ab2934506e5b',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'e24f49e4-6e74-4ea2-a28b-ec918029572d',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '63789abd-15b9-4c8c-be70-489ddc0bc518',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
        ],
        mapX: 3,
        mapY: -4,
      },
      {
        nodeID: '9',
        name: 'Service Provider',
        color: 'green',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '28c69db7-1563-40aa-ba38-523d2f9ed7ff',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '512b7fdd-d44b-492a-ab9d-bf5aacad7ea0',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '89cc0e77-9e8f-4c0f-af6c-1a1c43b0e063',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'a5b1a8b6-132e-4f64-ad1b-f16799ffeb3b',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '5794bdf9-aae1-4a7e-bf8c-b0d21f65afc2',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'f9d4531f-3eaa-4939-b287-c32f210b16ee',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 3,
        mapY: -3,
      },
      {
        nodeID: '12',
        name: 'Service Provider',
        color: 'green',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: 'f1bc48de-7d95-4225-acea-61e432853df9',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'fe431da2-c6b1-40b4-bc19-0bdf490f5619',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: 'a5e13e35-048f-46fd-917c-9896c340f120',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'aa86f05c-7948-4f2c-9114-348259fa893b',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: 'ca7fd79d-9810-468b-b0e0-849f5ff05226',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '3700f6b8-64b4-467d-9d0d-33909025620a',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 3,
        mapY: -2,
      },
      {
        nodeID: '4',
        name: 'Cellular Towers',
        color: 'green',
        preExecutionText: 'Cellular Towers has not been executed.',
        postExecutionSuccessText: 'Cellular Towers has been executed.',
        postExecutionFailureText: 'Cellular Towers has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: 'afb38dd0-61ac-4ec1-94e1-0699b2fa7d81',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '66ac6437-f521-491a-96fd-ebbd795a4a4f',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: 'e1abfa26-f5a9-432e-b966-8044020fb307',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '59c45473-6386-4c6c-ab33-29b68b3801d2',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '401315a3-25a0-4f7a-ac43-7372283de890',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '234e5a3f-465c-4fc9-bc7c-b3303f44bdcd',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 4,
        mapY: -5,
      },
      {
        nodeID: '7',
        name: 'Main Server',
        color: 'green',
        preExecutionText: 'Main Server has not been executed.',
        postExecutionSuccessText: 'Main Server has been executed.',
        postExecutionFailureText: 'Main Server has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: '765779fb-e72e-4d31-b622-1d2974d20620',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'eec38dde-580f-4cbd-942d-7b8ace813f1f',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '2b7898e5-bd08-423f-b42f-e769c4d71ab5',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '217698e2-ba6b-4dfe-8648-2674db5e22a7',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: 'a9b9d5ed-8c05-4671-b60d-1b4f42000152',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'ffaedbf3-256f-4dae-a59b-e819a403a78d',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 4,
        mapY: -4,
      },
      {
        nodeID: '10',
        name: 'Main Server',
        color: 'green',
        preExecutionText: 'Main Server has not been executed.',
        postExecutionSuccessText: 'Main Server has been executed.',
        postExecutionFailureText: 'Main Server has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: 'd55b4d78-1513-4b85-88a0-c66ab3fc2ed2',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '616467f7-0d7d-45a5-ab7a-c29588a790b7',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '904c1f77-5840-44ec-ad1f-4cbad0ad7cf0',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '5f4c427c-f444-4609-bdae-8d28b381ed8e',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '52b0a5e4-1bed-40d5-9dae-0ff4b6387515',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'e2bbd122-87d2-4b1f-b049-bd581472435c',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 4,
        mapY: -3,
      },
      {
        nodeID: '13',
        name: 'Main Server',
        color: 'green',
        preExecutionText: 'Main Server has not been executed.',
        postExecutionSuccessText: 'Main Server has been executed.',
        postExecutionFailureText: 'Main Server has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: 'b34b264e-6988-4b8a-a669-80e9e5f5580d',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '23d32cf0-997d-4453-b31f-e97e09aa3426',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: 'cdbc3b11-36b9-4871-987a-0867ebc5968f',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '5f69d0ce-b68a-49c9-9357-6a78c7ae20a7',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '7de62775-0ffe-4426-881b-037f77f932ad',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '407238d0-5bb7-42f8-ace5-fd934413b5f2',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 4,
        mapY: -2,
      },
      {
        nodeID: '14',
        name: 'Air Defense',
        color: 'pink',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '6e7dd1ac-e8ec-478a-a982-8240018a89e8',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '17f1a946-5764-4a6d-adc1-332b2da9a889',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '1f661e15-98b4-4d8f-a4af-dc627507911e',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '59971b31-c6fc-46dd-bc5f-f404ef49877d',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: 'cec13717-df32-4c1b-8de8-ebff1557c9be',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '23c9fd2f-428e-42b6-9966-eab68b16c035',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 0,
        mapY: -1,
      },
      {
        nodeID: '15',
        name: 'IADS Network',
        color: 'pink',
        preExecutionText: 'IADS Network has not been executed.',
        postExecutionSuccessText: 'IADS Network has been executed.',
        postExecutionFailureText: 'IADS Network has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '46342488-1739-4761-b06e-31227b4ad366',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'b128441a-f6a1-4171-a5b8-0f5e576f1c4e',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '9c81afc6-5c48-464c-9126-7000fd8d3233',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '6fcdf2d9-54d8-47cd-adf6-e42abf56bb13',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '5e10ff0e-cbb5-4cb7-ad2a-17d3be7edf10',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '54ae9fab-d7d1-4391-b703-21e40c8b449e',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: -1,
      },
      {
        nodeID: '16',
        name: 'Individual IADS Sites',
        color: 'pink',
        preExecutionText: 'Individual IADS Sites has not been executed.',
        postExecutionSuccessText: 'Individual IADS Sites has been executed.',
        postExecutionFailureText:
          'Individual IADS Sites has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '849d0a2e-aa4e-45ee-93c3-a769990e060e',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '747a7375-3ce1-4b3f-a247-7aea138d29d8',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '849a8221-fe6f-49c2-b825-2c08ffa552b5',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '7ecec83b-d385-4eba-932a-e354274c2924',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: 'ee055bc0-0a12-4773-a2df-6ad1b26b1cfe',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'b72e54b6-071f-4402-9e2e-62282ab7731e',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 2,
        mapY: -1,
      },
      {
        nodeID: '17',
        name: 'Launchers',
        color: 'pink',
        preExecutionText: 'Launchers has not been executed.',
        postExecutionSuccessText: 'Launchers has been executed.',
        postExecutionFailureText: 'Launchers has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: '42cb82e4-3ffd-4213-8287-64b911208c47',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '6a07b04c-8d63-43d7-ae9a-ddc765c88122',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '60e39961-b4e1-4a6c-b6af-fab856ee02f4',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '781dea4a-dc6b-46c5-b602-117bb31ee603',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '40c0f386-4af4-4608-b749-3a6de82d87f6',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'c57d6958-0d66-4fb9-a298-3435cc0cbeab',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 3,
        mapY: -1,
      },
      {
        nodeID: '18',
        name: 'Radars',
        color: 'pink',
        preExecutionText: 'Radars has not been executed.',
        postExecutionSuccessText: 'Radars has been executed.',
        postExecutionFailureText: 'Radars has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: 'f2ab130b-6d44-43e5-b8fa-1426db1fc06f',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '55ad7b44-71bf-4afd-8e42-a3fa95728c3d',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: 'beddc315-8641-480e-94a7-f2aaf6bf40f4',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '4ede900c-a350-4bbe-a214-48ada33ba4ca',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '63690c86-361f-4b73-b5dc-a68a54af8a3c',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '19c2cb7b-cb56-4200-b43c-c87093e46eb8',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 3,
        mapY: 0,
      },
      {
        nodeID: '19',
        name: 'Infrastructure',
        color: 'yellow',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '11ae7514-e47f-492f-8210-da1cbd719d5b',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'ee389cb2-3eec-4644-b5a7-970dbbc90e42',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '6a4ac54d-25ab-4a3d-8593-5d9ee0942a19',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '44e25e2f-5c1d-4fe7-bc31-244514051f08',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: 'f422a1c1-78b0-4f3a-81d3-02534137bbad',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '6be91890-bb7b-4e39-968c-e901a61b02ab',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 0,
        mapY: 1,
      },
      {
        nodeID: '20',
        name: 'Railroad System',
        color: 'yellow',
        preExecutionText: 'Railroad System has not been executed.',
        postExecutionSuccessText: 'Railroad System has been executed.',
        postExecutionFailureText: 'Railroad System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: 'd933a442-d7bc-4e2f-9e0c-a2a8119d8e51',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '9778c2a2-b440-4a0e-97bc-857d49d03566',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '3340a15e-da04-424c-9f7b-7b690bd6277b',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '2af3c598-0755-48c1-92c7-a957506788af',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '8bf6dac3-199f-4031-92a6-64b99f663f44',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '2163d948-04d3-4b7e-8a6d-ebcdeeac86a2',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: 0,
      },
      {
        nodeID: '23',
        name: 'Electrical System',
        color: 'yellow',
        preExecutionText: 'Electrical System has not been executed.',
        postExecutionSuccessText: 'Electrical System has been executed.',
        postExecutionFailureText: 'Electrical System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '0b87dfa4-e0cb-4160-b2b0-cb4afa7597d0',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '03ea3616-a045-4ce9-bda5-e54046a142e0',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '1639273d-25a7-42de-ae94-e8f26c36375a',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '58a5ac55-8b4e-4179-860e-949eba365be1',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '1fb593c8-6a9b-4d8e-a9db-7867b99e0fdd',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '036a3238-da36-4c9a-a449-1e0624fabe41',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: 1,
      },
      {
        nodeID: '25',
        name: 'Water System',
        color: 'yellow',
        preExecutionText: 'Water System has not been executed.',
        postExecutionSuccessText: 'Water System has been executed.',
        postExecutionFailureText: 'Water System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '7d0b50c0-89a1-4048-9f47-d41aa2adbfc0',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '0dcb7164-becc-4be8-b33b-61ec6ca711f3',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '05f1ae43-1997-470d-b64f-b1f2f13ea618',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '0db939d0-bab1-43f8-beb7-68bd304ff141',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '5fd74774-eca8-4210-bf5f-cf8db38575b6',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'c0467c9c-6d0d-4fd8-8227-362038cdd443',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: 2,
      },
      {
        nodeID: '27',
        name: 'Road System',
        color: 'yellow',
        preExecutionText: 'Road System has not been executed.',
        postExecutionSuccessText: 'Road System has been executed.',
        postExecutionFailureText: 'Road System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '57f90ba3-d5d9-4668-a215-3d8fb624f7d4',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '86e15e1e-f098-451c-adb4-f29a086aa986',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '8451f1cb-d505-49d8-9166-9b1dcf098edc',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '3efc2886-bec8-4232-a9a0-7a49d9a20c7a',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '45cae8cb-848d-4d4f-9344-37dcb8174398',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '729c6681-feb6-479d-a960-ed896e3b941f',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: 3,
      },
      {
        nodeID: '21',
        name: 'Track Monitoring',
        color: 'yellow',
        preExecutionText: 'Track Monitoring has not been executed.',
        postExecutionSuccessText: 'Track Monitoring has been executed.',
        postExecutionFailureText: 'Track Monitoring has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: '16f205d9-3172-480f-8024-814ef8d9cbf1',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '580e9598-dde2-47b5-ad56-53e067e9eb16',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '9894b2dd-f167-4cf6-9623-aa9d57c87212',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '001848c1-dd2c-4236-8ed3-c83915a73ed1',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '02b86e36-12b5-49a2-b789-d1f8b1ea0841',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'a7aad23e-9433-4a22-8ddc-73f957faad13',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 2,
        mapY: 0,
      },
      {
        nodeID: '22',
        name: 'Track Switch System',
        color: 'yellow',
        preExecutionText: 'Track Switch System has not been executed.',
        postExecutionSuccessText: 'Track Switch System has been executed.',
        postExecutionFailureText: 'Track Switch System has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: 'c56be2b0-0592-48e9-ba00-dfb202949d70',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'bfc363bd-c2c9-44bf-8def-37e030e117b8',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '29a6198d-ee20-4b50-88a0-537c103de03d',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '18fca62e-85f0-4986-8c29-8013500189e1',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '8d31bc40-289f-4066-aea9-823acdf19adb',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '4f3de0d1-4111-4f7c-b96d-6b7306ef6aed',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 2,
        mapY: 1,
      },
      {
        nodeID: '24',
        name: 'Regional Service',
        color: 'yellow',
        preExecutionText: 'Regional Service has not been executed.',
        postExecutionSuccessText: 'Regional Service has been executed.',
        postExecutionFailureText: 'Regional Service has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: '583fe452-0b98-4237-8201-c3167b9cde6a',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'a039893d-a510-450c-92ec-7bc27c880fcd',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '9aa2f549-6c44-41e3-8e82-a5d700501bb0',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'fd40e9da-c104-45f8-94db-0e4dc56ebe6d',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '6c03d1f4-5daf-4b73-8529-5ba0c30006f6',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'a578dac5-e2ea-40cd-9c2d-ce4e1fc98b30',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 2,
        mapY: 2,
      },
      {
        nodeID: '26',
        name: 'Valve System',
        color: 'yellow',
        preExecutionText: 'Valve System has not been executed.',
        postExecutionSuccessText: 'Valve System has been executed.',
        postExecutionFailureText: 'Valve System has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: 'f214af64-7a6d-4a94-9862-013cdfaeb4f2',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'ff92f0a3-0b51-4c66-a34e-3a53aeab60d0',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '64b20b5c-1b61-4257-8f35-5d2862e2dd77',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '0fb7b999-c039-46b3-85b3-049860fe0ef7',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '964582c0-7c74-4c02-ba6b-609c449bbe4c',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'b2a0c854-0ce7-408e-b6bf-01269d3a6840',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 2,
        mapY: 3,
      },
      {
        nodeID: '28',
        name: 'Traffic Light System',
        color: 'yellow',
        preExecutionText: 'Traffic Light System has not been executed.',
        postExecutionSuccessText: 'Traffic Light System has been executed.',
        postExecutionFailureText: 'Traffic Light System has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: 'fe18e272-a4e0-4507-a07b-60f10538932a',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '93ba811e-cf6b-4eec-a28b-06d4816e2d15',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '31951c25-e187-4ee8-b166-aaf3bad5272e',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'ab13b241-713c-490c-9093-3ae8f28946e7',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: 'd41c3721-5256-4f45-86ba-eb20d54406ed',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '6faa5b89-94c7-494c-be13-79adad59f31d',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 2,
        mapY: 4,
      },
      {
        nodeID: '29',
        name: 'CCTV System',
        color: 'yellow',
        preExecutionText: 'CCTV System has not been executed.',
        postExecutionSuccessText: 'CCTV System has been executed.',
        postExecutionFailureText: 'CCTV System has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: '265cd0e7-4fe8-4c39-a860-aa29a8a653a1',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '8ab079e4-f142-4c61-aea5-b6891ff8332f',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '266b3682-6d9e-4eff-932d-929dc3f275a3',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'd3aa964d-cfc1-47de-94a2-9f4c746adb8e',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '4b696bf6-ca13-49c6-8a1e-66040ea8a394',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'd1ead431-811b-48bc-bd33-cc72b7b3648b',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 2,
        mapY: 5,
      },
      {
        nodeID: '30',
        name: 'Satellite Services',
        color: 'blue',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        actions: [
          {
            actionID: '290cc02a-d9a0-4dfa-adf4-5579d3a8a8c9',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '35800dc1-249b-44c7-b425-b3c5f7f480c2',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '62097622-b14b-449b-b8fb-eda05e7c1ad7',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '524ce418-4c4f-4673-bcb1-1350b9621823',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '392ad0b5-0197-442b-b666-b00355640257',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '1feb396c-1358-4ade-b3ff-8eae9f186c93',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 0,
        mapY: 4,
      },
      {
        nodeID: '31',
        name: 'Global Positioning',
        color: 'blue',
        preExecutionText: 'Global Positioning has not been executed.',
        postExecutionSuccessText: 'Global Positioning has been executed.',
        postExecutionFailureText: 'Global Positioning has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: '6fe1af1d-5d60-49a8-ae01-c1e64b02c82d',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '1e964a38-dcb5-462b-8d41-6ab413dfc410',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '5de30579-8af9-441d-bc43-5bfeef9ed23f',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'ed8640bb-068b-40a6-9666-cdab4b6aa206',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: 'afb73d93-86bf-420b-95d5-44fd8985810b',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'f21fdd09-28cb-4e95-8c34-ceb8b9bb15b0',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: 4,
      },
      {
        nodeID: '32',
        name: 'Data Transfer',
        color: 'blue',
        preExecutionText: 'Data Transfer has not been executed.',
        postExecutionSuccessText: 'Data Transfer has been executed.',
        postExecutionFailureText: 'Data Transfer has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: 'bff61011-1aea-4f8c-874f-c0ca771c8400',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: '49dfbefd-f7cd-47a3-889c-4a332cd06cab',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '30b80214-5505-4f69-8afa-6db17f3ddc8c',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '271da815-0966-4fb6-8f30-4dddf617a496',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '59dfcf35-7f90-4ed7-8f16-18ce81fff66c',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '090422d5-9576-4f15-8ace-2eacbcedb4eb',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: 5,
      },
      {
        nodeID: '33',
        name: 'Imagery Collection',
        color: 'blue',
        preExecutionText: 'Imagery Collection has not been executed.',
        postExecutionSuccessText: 'Imagery Collection has been executed.',
        postExecutionFailureText: 'Imagery Collection has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: '689dfd2d-e28a-4f81-b2ac-f6466caf5c92',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'ba4ac186-83bf-4655-8f65-e80ef5f89708',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: 'd935e0e8-98e5-4f8e-8b5d-c4af9602ff58',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: '082c8664-04ee-4db8-9831-a8a295806176',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '11461012-8363-4e8b-9704-d784baae892d',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: '3e4e1939-863a-4ce4-a578-864e6d6d92dd',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: 6,
      },
      {
        nodeID: '34',
        name: 'Sensor Observation',
        color: 'blue',
        preExecutionText: 'Sensor Observation has not been executed.',
        postExecutionSuccessText: 'Sensor Observation has been executed.',
        postExecutionFailureText: 'Sensor Observation has failed to execute.',
        actionData: 'exec command',
        executable: true,
        actions: [
          {
            actionID: '7cf46809-51d7-4d99-9ec6-8f272e30e26c',
            name: 'Deny',
            processTime: 1000,
            successChance: 0.5,
            description: 'This will deny.',
          },
          {
            actionID: 'e1670b40-50fa-4364-8e6f-7b976269e69b',
            name: 'Degrade',
            processTime: 2000,
            successChance: 0.6,
            description: 'This will degrade.',
          },
          {
            actionID: '8ec24ee0-c8fa-4c05-84ba-5ac31c29f598',
            name: 'Destroy',
            processTime: 3000,
            successChance: 0.6,
            description: 'This will destroy.',
          },
          {
            actionID: 'c4016043-313c-4676-b2fe-a488cf40b6c1',
            name: 'Disrupt',
            processTime: 4000,
            successChance: 0.7,
            description: 'This will disrupt.',
          },
          {
            actionID: '18a4b254-26a2-48ab-9a37-d7ba21be69bd',
            name: 'Manipulate',
            processTime: 5000,
            successChance: 0.8,
            description: 'This will manipulate.',
          },
          {
            actionID: 'f7096a7a-8484-487e-bd0d-88171a5148b7',
            name: 'Extract',
            processTime: 6000,
            successChance: 0.8,
            description: 'This will extract.',
          },
        ],
        mapX: 1,
        mapY: 7,
      },
    ],
  }

  return new Mission(
    testMissionJson.missionID,
    testMissionJson.name,
    testMissionJson.versionNumber,
    testMissionJson.nodeStructure,
    testMissionJson.nodeData,
    testMissionJson.seed,
    expandAll,
  )
}

// This gets the data from the database
// and creates a specific mission based
// on the data it returns
export function getMission(
  callback: (mission: Mission) => void,
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
        missionJson.nodeStructure,
        missionJson.nodeData,
        missionJson.seed,
        false,
      )
      callback(mission)
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
      console.error('Failed to retrieve mission.')
      console.error(error)
      callbackError(error)
    })
}

export default {
  MissionNode,
  Mission,
  createTestMission,
  getMission,
}
