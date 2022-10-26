import { Counter, isInteger } from './numbers'
import { AnyObject } from 'mongoose'
import seedrandom, { PRNG } from 'seedrandom'
import { v4 as generateHash } from 'uuid'
import axios, { AxiosResponse } from 'axios'

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
  nodeActionItems: Array<MissionNodeAction>
  selectedNodeAction: MissionNodeAction | null
  _executed: boolean
  _executing: boolean
  mapX: number
  mapY: number
  _isExpanded: boolean

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
    mission: Mission,
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
    this.nodeActionItems = nodeActionItems
    this.selectedNodeAction = null
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
    let selectedNodeAction: MissionNodeAction | null = this.selectedNodeAction

    if (
      this.executable === true &&
      this.executed === false &&
      selectedNodeAction !== null
    ) {
      this._executing = true
      setTimeout(() => {
        this._executing = false
        this._executed = true

        callback(this.willSucceed)
      }, selectedNodeAction.timeDelay)
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
  name: string
  versionNumber: number
  nodeStructure: AnyObject
  nodeData: Array<AnyObject>
  nodes: Map<string, MissionNode>
  seed: number
  rng: PRNG
  rootNode: MissionNode
  structureChangeKey: string
  structureChangeHandlers: Array<(structureChangeKey: string) => void>

  constructor(
    name: string,
    versionNumber: number,
    nodeStructure: AnyObject,
    nodeData: Array<AnyObject>,
    seed: number,
    expandAll: boolean = false,
  ) {
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

    this.parseJSON()
    this.mapNodeRelationships(expandAll, this.rootNode, nodeStructure)
    this.positionNodes()
  }

  parseJSON(): void {
    try {
      let nodeData: Array<AnyObject> = this.nodeData

      this.nodes.clear()

      // Converts raw node data into MissionNode
      // objects, then it stores the created
      // objects in the nodeData map.
      for (let nodeDatum of nodeData) {
        let nodeActionItems = []

        for (let actionItem of nodeDatum.nodeActionItems) {
          let willSucceed: boolean = Mission.determineNodeSuccess(
            actionItem.successChance,
            this.rng,
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
          this,
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
  // called "New Node".
  spawnNewNode(): void {
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

  // This will determine whether a
  // node succeeds or fails based
  // on the success chance passed.
  static determineNodeSuccess = (successChance: number, rng: PRNG): boolean => {
    return rng.double() <= successChance
  }
}

// ! TO-BE-REMOVED
// This creates a test mission for
// testing purposes.
export function createTestMission(expandAll: boolean = false): Mission {
  const testMissionJson: IMissionJson = {
    name: 'Incredible Mission',
    versionNumber: 1,
    seed: 980238470934,
    nodeStructure: {
      '1': {
        '2': {
          '3': {
            '4': {
              END: 'END',
            },
          },
        },
        '5': {
          '6': {
            '7': {
              END: 'END',
            },
          },
        },
        '8': {
          '9': {
            '10': {
              END: 'END',
            },
          },
        },
        '11': {
          '12': {
            '13': {
              END: 'END',
            },
          },
        },
      },
      '14': {
        '15': {
          '16': {
            '17': {
              END: 'END',
            },
            '18': { END: 'END' },
          },
        },
      },
      '19': {
        '20': {
          '21': { END: 'END' },
          '22': { END: 'END' },
        },
        '23': {
          '24': { END: 'END' },
        },
        '25': {
          '26': { END: 'END' },
        },
        '27': {
          '28': { END: 'END' },
          '29': { END: 'END' },
        },
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
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
        nodeActionItems: [
          {
            text: 'Deny',
            timeDelay: 1000,
            successChance: 0.5,
            willSucceed: false,
          },
          {
            text: 'Degrade',
            timeDelay: 2000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Destroy',
            timeDelay: 3000,
            successChance: 0.6,
            willSucceed: false,
          },
          {
            text: 'Disrupt',
            timeDelay: 4000,
            successChance: 0.7,
            willSucceed: false,
          },
          {
            text: 'Manipulate',
            timeDelay: 5000,
            successChance: 0.8,
            willSucceed: false,
          },
          {
            text: 'Extract',
            timeDelay: 6000,
            successChance: 0.8,
            willSucceed: false,
          },
        ],
        mapX: 1,
        mapY: 7,
      },
    ],
  }

  return new Mission(
    testMissionJson.name,
    testMissionJson.versionNumber,
    testMissionJson.nodeStructure,
    testMissionJson.nodeData,
    testMissionJson.seed,
    expandAll,
  )
}

export default {
  MissionNode,
  Mission,
  createTestMission,
}
