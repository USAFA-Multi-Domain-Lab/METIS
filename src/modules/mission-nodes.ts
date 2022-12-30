// This is an enum used by the
// MissionNode move
// function to describe the
// purpose of the target

import { Mission } from './missions'
import {
  IMissionNodeActionJSON,
  MissionNodeAction,
} from './mission-node-actions'
import { IMissionMappable } from '../components/content/MissionMap'

export enum ENodeTargetRelation {
  ParentOfTargetAndChildren,
  ParentOfTargetOnly,
  ChildOfTarget,
  BetweenTargetAndChildren,
  PreviousSiblingOfTarget,
  FollowingSiblingOfTarget,
}

export enum ENodeDeleteMethod {
  DeleteNodeAndChildren,
  DeleteNodeAndShiftChildren,
}

// This is the raw node data returned
// from the server used to create instances
// of MissionNode in the Mission class.
export interface IMissionNodeJson {
  nodeID: string
  name: string
  color: string
  preExecutionText: string
  executable: boolean
  device: boolean
  actions: Array<IMissionNodeActionJSON>
}

// These are options that can be passed
// when deleting a node with the delete
// function.
export interface INodeDeleteOptions {
  calledByParentDelete?: boolean // Default "false"
  deleteMethod?: ENodeDeleteMethod // Default "ENodeDeleteMethod.DeleteNodeAndChildren"
}

// This represents an individual node
// for a student to execute within a
// mission.
export class MissionNode implements IMissionMappable {
  mission: Mission
  nodeID: string
  name: string
  parentNode: MissionNode | null
  childNodes: Array<MissionNode>
  color: string
  preExecutionText: string
  executable: boolean
  device: boolean
  _depthPadding: number
  actions: Array<MissionNodeAction> = []
  selectedAction: MissionNodeAction | null
  executed: boolean
  executing: boolean
  mapX: number
  mapY: number
  depth: number
  _isOpen: boolean
  _expandedInMenu: boolean

  static default_name: string = 'Unnamed Node'
  static default_color: string = 'default'
  static default_preExecutionText: string = 'Node has not been executed.'
  static default_depthPadding: number = 0
  static default_executable: boolean = false
  static default_device: boolean = false
  static default_actions: Array<IMissionNodeActionJSON> = []
  static default_mapX: number = 0
  static default_mapY: number = 0

  // Getter for _depthPadding.
  get depthPadding(): number {
    return this._depthPadding
  }

  // Setter for _depthPadding.
  set depthPadding(depthPadding: number) {
    this._depthPadding = depthPadding
    this._handleStructureChange()
  }

  get descendantDepth(): number {
    let deepestDescendant: MissionNode = this

    while (deepestDescendant.childNodes.length > 0) {
      deepestDescendant = deepestDescendant.childNodes[0]
    }

    return deepestDescendant.depth
  }

  get descendantMaxY(): number {
    let deepestLowestDescendant: MissionNode = this

    while (deepestLowestDescendant.childNodes.length > 0) {
      deepestLowestDescendant =
        deepestLowestDescendant.childNodes[
          deepestLowestDescendant.childNodes.length - 1
        ]
    }

    return deepestLowestDescendant.mapY
  }

  constructor(
    mission: Mission,
    nodeID: string,
    name: string,
    color: string,
    preExecutionText: string,
    depthPadding: number,
    executable: boolean,
    device: boolean,
    actionJSON: Array<IMissionNodeActionJSON>,
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
    this._depthPadding = depthPadding
    this.executable = executable
    this.device = device
    this.selectedAction = null
    this.executed = false
    this.executing = false
    this.mapX = mapX
    this.mapY = mapY
    this.depth = -1
    this._isOpen = false
    this._expandedInMenu = true

    this.parseActionJSON(actionJSON)
  }

  // This will turn the action JSON
  // into new MissionNodeAction objects.
  parseActionJSON(actionJSON: Array<IMissionNodeActionJSON>): void {
    let actions = []

    for (let action of actionJSON) {
      let actionObject: MissionNodeAction = new MissionNodeAction(
        this,
        action.actionID,
        action.name,
        action.description,
        action.processTime,
        action.successChance,
        action.resourceCost,
        action.postExecutionSuccessText,
        action.postExecutionFailureText,
      )
      actions.push(actionObject)
    }

    this.actions = actions
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
    let childrenOfParent: Array<MissionNode> = [this]

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

  get isOpen(): boolean {
    return this._isOpen
  }

  get isClosed(): boolean {
    return !this._isOpen
  }

  get expandedInMenu(): boolean {
    return this._expandedInMenu
  }

  get collapsedInMenu(): boolean {
    return !this._expandedInMenu
  }

  // This will open the node.
  open(): void {
    this._isOpen = true
    this.mission.lastOpenedNode = this
    this._handleStructureChange()
  }

  // This will close the node.
  close(): void {
    this._isOpen = false
    this._handleStructureChange()
  }

  // This will toggle the expandedInMenu
  // property. Also pizza is delicious.
  // Especially if it's from 600, or as
  // Jacob likes to call it, Pinthouse.
  toggleMenuExpansion(): void {
    this._expandedInMenu = !this._expandedInMenu
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

    // This will move the target based on
    // its relation to this node.
    switch (targetRelation) {
      case ENodeTargetRelation.ParentOfTargetOnly:
        this.parentNode = target.parentNode
        let targetAndTargetSiblings: Array<MissionNode> =
          target.childrenOfParent

        if (target.parentNode !== null) {
          for (
            let index: number = 0;
            index < targetAndTargetSiblings.length;
            index++
          ) {
            let sibling = targetAndTargetSiblings[index]

            if (target.nodeID === sibling.nodeID) {
              targetAndTargetSiblings[index] = this
            }
          }

          target.parentNode.childNodes = targetAndTargetSiblings
        }

        this.childNodes = [target]
        target.parentNode = this

        this.open()

        break
      case ENodeTargetRelation.ParentOfTargetAndChildren:
        // TODO
        break
      case ENodeTargetRelation.BetweenTargetAndChildren:
        let childNodes: Array<MissionNode> = target.childNodes

        target.childNodes = [this]
        this.parentNode = target

        for (let childNode of childNodes) {
          childNode.parentNode = this
        }
        this.childNodes = childNodes

        target.open()

        if (childNodes.length > 0) {
          this.open()
        }

        break
      case ENodeTargetRelation.ChildOfTarget:
        target.childNodes.push(this)
        this.parentNode = target
        break
      case ENodeTargetRelation.PreviousSiblingOfTarget:
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
      case ENodeTargetRelation.FollowingSiblingOfTarget:
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
    }

    this._handleStructureChange()
  }

  // This will open all child nodes
  // of this node if possible.
  openChildNodes(): void {
    for (let childNode of this.childNodes) {
      childNode.open()
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

  // This will reveal the node creators,
  // allowing a node to be created adjacent
  // to it if the mission is tied to a map.
  generateNodeCreators(): void {
    this.mission.nodeCreationTarget = this
  }

  // This will hide any revealed node
  // creators, restoring the view
  // to only the node structure.
  destroyNodeCreators(): void {
    this.mission.nodeCreationTarget = null
  }

  // This will delete a node given the
  // options passed by the caller.
  delete(
    options: INodeDeleteOptions = {
      calledByParentDelete: false,
      deleteMethod: ENodeDeleteMethod.DeleteNodeAndChildren,
    },
  ): void {
    let calledByParentDelete: boolean = options.calledByParentDelete === true
    let deleteMethod: ENodeDeleteMethod = options.deleteMethod
      ? options.deleteMethod
      : ENodeDeleteMethod.DeleteNodeAndChildren

    switch (deleteMethod) {
      case ENodeDeleteMethod.DeleteNodeAndChildren:
        let childNodes: Array<MissionNode> = [...this.childNodes]

        for (let childNode of childNodes) {
          let childOptions: INodeDeleteOptions = {
            ...options,
            calledByParentDelete: true,
          }
          childNode.delete(childOptions)
        }

        this.childrenOfParent.splice(this.childrenOfParent.indexOf(this), 1)
        this.mission.nodes.delete(this.nodeID)
        break
      case ENodeDeleteMethod.DeleteNodeAndShiftChildren:
        let parentOfSelectedNode: MissionNode | null = this.parentNode
        let childrenofSelectedNode: Array<MissionNode> = [...this.childNodes]

        childrenofSelectedNode.forEach((childNode: MissionNode) => {
          if (parentOfSelectedNode !== null) {
            parentOfSelectedNode.childNodes.splice(
              parentOfSelectedNode.childNodes.indexOf(this),
              0,
              childNode,
            )
            childNode.parentNode = parentOfSelectedNode
          }
        })

        if (parentOfSelectedNode !== null) {
          parentOfSelectedNode.childNodes.splice(
            parentOfSelectedNode.childNodes.indexOf(this),
            1,
          )
          this.mission.nodes.delete(this.nodeID)
          this.mission.handleStructureChange()
        }
        break
    }

    if (calledByParentDelete !== true) {
      // Structure change is handled as long
      // as one node exists. If not, a new
      // node is created. Creating this node
      // will handle the structure change for
      // us.
      if (this.mission.nodes.size > 0) {
        this._handleStructureChange()
      } else {
        this.mission.spawnNewNode()
      }
    }
  }
}

// This represents a node that, when triggered,
// will spawn a new node in a mission in a specific
// location.
export class MissionNodeCreator implements IMissionMappable {
  _nodeID: string
  _name: string
  _mission: Mission
  _creationTarget: MissionNode
  _creationTargetRelation: ENodeTargetRelation
  mapX: number
  mapY: number
  depth: number
  _createdNode: MissionNode | null = null

  // Getter for _nodeID.
  get nodeID(): string {
    return this._nodeID
  }

  // Getter for _name.
  get name(): string {
    return this._name
  }

  // Getter for _mission.
  get mission(): Mission {
    return this._mission
  }

  // Getter for _creationTarget.
  get creationTarget(): MissionNode {
    return this._creationTarget
  }

  // Getter for _creationTargetRelation.
  get creationTargetRelation(): ENodeTargetRelation {
    return this._creationTargetRelation
  }

  // Getter for _createdNode.
  get createdNode(): MissionNode | null {
    return this._createdNode
  }

  // Implementation requirement only.
  get executable(): boolean {
    return false
  }

  // Implementation requirement only.
  get executing(): boolean {
    return false
  }

  // Implementation requirement only.
  get device(): boolean {
    return false
  }

  constructor(
    mission: Mission,
    creationTarget: MissionNode,
    creationTargetRelation: ENodeTargetRelation,
    mapX: number,
    mapY: number,
  ) {
    let relationTitle: string = ''

    switch (creationTargetRelation) {
      case ENodeTargetRelation.ParentOfTargetAndChildren:
        relationTitle = 'parent-of-target-and-children'
        break
      case ENodeTargetRelation.ParentOfTargetOnly:
        relationTitle = 'parent-of-target-only'
        break
      case ENodeTargetRelation.BetweenTargetAndChildren:
        relationTitle = 'between-target-and-children'
        break
      case ENodeTargetRelation.ChildOfTarget:
        relationTitle = 'child-of-target'
        break
      case ENodeTargetRelation.PreviousSiblingOfTarget:
        relationTitle = 'previous-sibling-of-target'
        break
      case ENodeTargetRelation.FollowingSiblingOfTarget:
        relationTitle = 'following-sibling-of-target'
        break
    }

    this._nodeID = `node-creator_with-${creationTarget.nodeID}-as-${relationTitle}`
    this._name = '+'
    this._mission = mission
    this.mapX = mapX
    this.mapY = mapY
    this.depth = -1
    this._creationTarget = creationTarget
    this._creationTargetRelation = creationTargetRelation
  }

  // This is called to create the
  // new node.
  create(): MissionNode {
    if (this.createdNode !== null) {
      console.error(new Error("Can't create node. Node is already created."))
    }

    let node: MissionNode = this.mission.spawnNewNode()

    // node.color = this.creationTarget.color
    node.move(this.creationTarget, this.creationTargetRelation)
    this._createdNode = this.createdNode
    this.mission.nodeCreationTarget = null

    return node
  }
}

export default {
  MissionNode,
  MissionNodeCreator,
}
