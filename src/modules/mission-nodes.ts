// This is an enum used by the
// MissionNode move
// function to describe the
// purpose of the target

import { Mission } from './missions'
import { MissionNodeAction } from './mission-node-actions'
import { AnyObject } from './toolbox/objects'

// property past.
export enum ENodeTargetRelation {
  Parent,
  PreviousSibling,
  FollowingSibling,
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
  actionData: string
  executable: boolean
  nodeActionItems: Array<{
    text: string
    timeDelay: number
    successChance: number
    resourceCost: number
    postExecutionSuccessText: string
    postExecutionFailureText: string
    willSucceed: boolean
  }>
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
  executable: boolean
  device: boolean
  actions: Array<MissionNodeAction> = []
  selectedAction: MissionNodeAction | null
  _executed: boolean
  _executing: boolean
  mapX: number
  mapY: number
  depth: number
  _isExpanded: boolean

  static default_name: string = 'Unnamed Node'
  static default_color: string = 'default'
  static default_preExecutionText: string = 'Node has not been executed.'
  static default_executable: boolean = false
  static default_device: boolean = false
  static default_actionData: Array<AnyObject> = []
  static default_mapX: number = 0
  static default_mapY: number = 0

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
    executable: boolean,
    device: boolean,
    actionData: Array<AnyObject>,
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
    this.executable = executable
    this.device = device
    this.selectedAction = null
    this._executed = false
    this._executing = false
    this.mapX = mapX
    this.mapY = mapY
    this.depth = -1
    this._isExpanded = false

    this.parseActionData(actionData)
  }

  // This will turn the action data
  // into new MissionNodeAction objects.
  parseActionData(actionData: Array<AnyObject>): void {
    let actions = []

    for (let actionDatum of actionData) {
      let nodeAction: MissionNodeAction = new MissionNodeAction(
        this,
        actionDatum.actionID,
        actionDatum.name,
        actionDatum.description,
        actionDatum.processTime,
        actionDatum.successChance,
        actionDatum.resourceCost,
        actionDatum.postExecutionSuccessText,
        actionDatum.postExecutionFailureText,
      )
      actions.push(nodeAction)
    }

    this.actions = actions
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

  // This will return whether this node
  // has children or not.
  get hasChildren(): boolean {
    return this.childNodes.length > 0
  }

  // This will return whether this node
  // has siblings or not.
  get hasSiblings(): boolean {
    return this.childrenOfParent.length > 1
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
      this.mission.lastExpandedNode = this
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

  // This will delete this node and
  // all child nodes from the mission.
  delete(): void {
    for (let childNode of this.childNodes) {
      childNode.delete()
    }

    this.childrenOfParent.splice(this.childrenOfParent.indexOf(this), 1)
    this.mission.nodes.delete(this.nodeID)

    this._handleStructureChange()
  }
}

export default {
  MissionNode,
}
