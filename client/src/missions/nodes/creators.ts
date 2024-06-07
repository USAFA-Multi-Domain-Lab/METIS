import ClientMissionNode, { ENodeTargetRelation } from '.'
import ClientMission from '..'
import { Vector2D } from '../../../../shared/toolbox/space'
import ClientActionExecution from '../actions/executions'

/**
 * Represents a node that, when triggerred,
 * will spawn a new node in a mission in a
 * specific location.
 */
export default class NodeCreator {
  // Implemented
  public get nodeId(): string {
    let creationTarget: ClientMissionNode | null = this.creationTarget

    if (creationTarget) {
      return `node-creator_with-${creationTarget._id}-as-${this.targetRelation}`
    } else {
      return `node-creator_with-no-target-as-${this.targetRelation}`
    }
  }

  _name: string
  _mission: ClientMission

  /**
   * The relation of the creator to the creation target.
   */
  _targetRelation: ENodeTargetRelation
  /**
   * The relation of the creator to the creation target.
   */
  public get targetRelation(): ENodeTargetRelation {
    return this._targetRelation
  }

  public position: Vector2D

  public depth: number

  public execution: ClientActionExecution | null

  // Getter for _name.
  public get name(): string {
    return this._name
  }

  // Getter for _mission.
  public get mission(): ClientMission {
    return this._mission
  }

  /**
   * The target for creation. Same as the one in mission.
   */
  public get creationTarget(): ClientMissionNode | null {
    return this.mission.creationTarget
  }

  /**
   * The node created by this creator, if any.
   */
  private _createdNode: ClientMissionNode | null = null
  /**
   * The node created by this creator, if any.
   */
  public get createdNode(): ClientMissionNode | null {
    return this._createdNode
  }

  // Implemented
  public get executable(): boolean {
    return false
  }

  // Implemented
  public get executing(): boolean {
    return false
  }

  // Implemented
  public get device(): boolean {
    return false
  }

  // Implemented
  public get color(): string {
    return ''
  }

  // Implemented
  public get isOpen(): boolean {
    return false
  }

  // Implemented
  public get pendingOpen(): boolean {
    return false
  }

  // Implemented
  public get pendingExecInit(): boolean {
    return false
  }

  // Implemented
  public get childNodes(): ClientMissionNode[] {
    return []
  }

  public constructor(
    mission: ClientMission,
    targetRelation: ENodeTargetRelation,
  ) {
    this._name = '+'
    this._mission = mission
    this.position = new Vector2D(0, 0)
    this.depth = -1
    this.execution = null
    this._targetRelation = targetRelation

    // Sync position.
    this.syncPosition()
  }

  /**
   * Calculates and sets the position of the creator
   * based on the position of the creation target and
   * its relation to it.
   */
  public syncPosition(): void {
    // Grab details.
    let relation: ENodeTargetRelation = this.targetRelation
    let target: ClientMissionNode | null = this.creationTarget

    // If there is no target, set position to 0,0
    // and depth to -1, then return.
    if (target === null) {
      this.position = new Vector2D(0, 0)
      this.depth = -1
      return
    }

    // Initialize position and depth.
    this.position = target.prototype.position.clone()
    this.depth = target.prototype.depth

    // Shift position and depth based on relation.
    switch (relation) {
      case ENodeTargetRelation.ParentOfTargetAndChildren:
        this.position.translateX(-2 * ClientMissionNode.COLUMN_WIDTH)
        this.depth -= 2
        break
      case ENodeTargetRelation.ParentOfTargetOnly:
        this.position.translateX(-1 * ClientMissionNode.COLUMN_WIDTH)
        this.depth -= 1
        break
      case ENodeTargetRelation.BetweenTargetAndChildren:
        this.position.translateX(1 * ClientMissionNode.COLUMN_WIDTH)
        this.depth += 1
        break
      case ENodeTargetRelation.PreviousSiblingOfTarget:
        this.position.translateY(-1 * ClientMissionNode.ROW_HEIGHT)
        break
      case ENodeTargetRelation.FollowingSiblingOfTarget:
        this.position.translateY(1 * ClientMissionNode.ROW_HEIGHT)
        break
    }
  }

  // This is called to create the
  // new node.
  public create(): ClientMissionNode {
    // todo: Fix this to work with prototypes.
    // if (this.createdNode !== null) {
    //   throw new Error("Can't create node. Node is already created.")
    // }
    // if (this.creationTarget === null) {
    //   throw new Error("Can't create node. No creation target.")
    // }

    //     let node: ClientMissionNode = this.mission.spawnPrototype()
    //
    //     // node.color = this.creationTarget.color
    //     node.move(this.creationTarget, this.targetRelation)
    //     this._createdNode = this.createdNode
    //     this.mission.creationMode = false
    //     this.mission.deselectNode()
    // return node

    throw Error('Not implemented.')
  }
}
