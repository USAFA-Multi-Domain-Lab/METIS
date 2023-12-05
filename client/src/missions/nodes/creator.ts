import ClientMission from '..'
import ClientMissionNode, { ENodeTargetRelation } from '.'
import { IMissionMappable } from 'src/components/content/game/MissionMap'
import ClientActionExecution from '../actions/executions'

/**
 * Represents a node that, when triggerred,
 * will spawn a new node in a mission in a
 * specific location.
 */
export default class NodeCreator implements IMissionMappable {
  _nodeID: string
  _name: string
  _mission: ClientMission
  _creationTarget: ClientMissionNode
  _creationTargetRelation: ENodeTargetRelation
  mapX: number
  mapY: number
  depth: number
  execution: ClientActionExecution | null
  _createdNode: ClientMissionNode | null = null

  // Getter for _nodeID.
  get nodeID(): string {
    return this._nodeID
  }

  // Getter for _name.
  get name(): string {
    return this._name
  }

  // Getter for _mission.
  get mission(): ClientMission {
    return this._mission
  }

  // Getter for _creationTarget.
  get creationTarget(): ClientMissionNode {
    return this._creationTarget
  }

  // Getter for _creationTargetRelation.
  get creationTargetRelation(): ENodeTargetRelation {
    return this._creationTargetRelation
  }

  // Getter for _createdNode.
  get createdNode(): ClientMissionNode | null {
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

  // Implementation requirement only.
  get color(): string {
    return ''
  }

  // Implementation requirement only.
  get isOpen(): boolean {
    return false
  }

  // Implementation requirement only.
  public get pendingOpen(): boolean {
    return false
  }

  // Implementation requirement only.
  public get pendingExecInit(): boolean {
    return false
  }

  get childNodes(): ClientMissionNode[] {
    return []
  }

  constructor(
    mission: ClientMission,
    creationTarget: ClientMissionNode,
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
    this.execution = null
    this._creationTarget = creationTarget
    this._creationTargetRelation = creationTargetRelation
  }

  // This is called to create the
  // new node.
  create(): ClientMissionNode {
    if (this.createdNode !== null) {
      console.error(new Error("Can't create node. Node is already created."))
    }

    let node: ClientMissionNode = this.mission.spawnNode()

    // node.color = this.creationTarget.color
    node.move(this.creationTarget, this.creationTargetRelation)
    this._createdNode = this.createdNode
    this.mission.nodeCreationTarget = null

    return node
  }
}
