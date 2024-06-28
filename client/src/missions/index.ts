import axios, { AxiosResponse } from 'axios'
import { TLine_P } from 'src/components/content/session/mission-map/objects/Line'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { TEventListenerTarget } from 'src/toolbox/hooks'
import { v4 as generateHash } from 'uuid'
import Mission, {
  TCommonMissionJson,
  TCommonMissionTypes,
  TMissionOptions,
} from '../../../shared/missions'
import {
  MissionForce,
  TCommonMissionForceJson,
  TMissionForceOptions,
} from '../../../shared/missions/forces'
import { TMissionPrototypeOptions } from '../../../shared/missions/nodes/prototypes'
import { Counter } from '../../../shared/toolbox/numbers'
import { TWithKey } from '../../../shared/toolbox/objects'
import { Vector2D } from '../../../shared/toolbox/space'
import StringToolbox from '../../../shared/toolbox/strings'
import ClientMissionAction from './actions'
import ClientActionExecution from './actions/executions'
import ClientActionOutcome from './actions/outcomes'
import { ClientEffect } from './effects'
import ClientMissionForce from './forces'
import ClientMissionNode, { ENodeTargetRelation } from './nodes'
import NodeCreator from './nodes/creators'
import ClientMissionPrototype from './nodes/prototypes'

/**
 * Class for managing missions on the client.
 * @extends {Mission<ClientMissionNode>}
 */
export default class ClientMission
  extends Mission<TClientMissionTypes>
  implements TEventListenerTarget<TMissionEvent>, TMissionNavigable
{
  /**
   * Whether the resource exists on the server.
   */
  protected _existsOnServer: boolean
  /**
   * Whether the resource exists on the server.
   */
  public get existsOnServer(): boolean {
    return this._existsOnServer
  }

  /**
   * The depth of the missions node structure.
   */
  protected _depth: number
  /**
   * The depth of the missions node structure.
   */
  public get depth(): number {
    return this._depth
  }

  /**
   * A key for tracking state changes in the mission's structure.
   */
  protected _structureChangeKey: string
  /**
   * A key for tracking state changes in the mission's structure.
   */
  public get structureChangeKey(): string {
    return this._structureChangeKey
  }

  /**
   * Whether the structure of the mission has been initialized.
   */
  protected structureInitialized: boolean = false

  /**
   * Listeners for mission events.
   */
  private listeners: Array<[TMissionEvent, () => void]>

  /**
   * The currently selected force in the mission.
   * @deprecated
   */
  private _selectedForce: ClientMissionForce | null
  /**
   * The currently selected force in the mission.
   * @deprecated
   */
  public get selectedForce(): ClientMissionForce | null {
    return this._selectedForce
  }

  /**
   * The currently selected node in the mission.
   * @note Used in the form for editing.
   * @deprecated
   */
  private _selectedNode: ClientMissionNode | null = null
  /**
   * The currently selected node in the mission.
   * @note Used in the form for editing.
   * @deprecated
   */
  public get selectedNode(): ClientMissionNode | null {
    return this._selectedNode
  }

  /**
   * The current selection for the mission.
   * @note This can be most type of nested, mission-related objects,
   * such as nodes, forces, etc.
   * @note This is used in the form for editing.
   * @note By default, the mission itself.
   */
  private _selection: TMissionNavigable
  /**
   * The current selection for the mission.
   * @note This can be most type of nested, mission-related objects,
   * such as nodes, forces, etc.
   * @note This is used in the form for editing.
   * @note By default, the mission itself.
   */
  public get selection(): TMissionNavigable {
    return this._selection
  }

  /**
   * The target node for creating a new node.
   */
  public get creationTarget(): ClientMissionNode | null {
    return this.creationMode ? this.selectedNode : null
  }

  /**
   * Whether creation mode is enabled for the selected node.
   */
  private _creationMode: boolean = false
  /**
   * Whether creation mode is enabled for the selected node.
   * @note Does nothing if there is no selected node.
   * @note Used in the form for editing.
   */
  public get creationMode(): boolean {
    return this._creationMode
  }
  /**
   * Whether creation mode is enabled for the selected node.
   * @note Does nothing if there is no selected node.
   * @note Used in the form for editing.
   */
  public set creationMode(value) {
    // Get the selected node.
    let selectedNode: ClientMissionNode | null = this._selectedNode

    // If there is no selected node, do nothing.
    if (selectedNode === null) {
      console.warn('Cannot set creation mode when there is no selected node.')
      return
    }

    // Update the creation mode.
    this._creationMode = value

    // Determine node creators.
    this._nodeCreators = value
      ? [
          new NodeCreator(this, ENodeTargetRelation.ParentOfTargetOnly),
          new NodeCreator(this, ENodeTargetRelation.BetweenTargetAndChildren),
          new NodeCreator(this, ENodeTargetRelation.PreviousSiblingOfTarget),
          new NodeCreator(this, ENodeTargetRelation.FollowingSiblingOfTarget),
        ]
      : []

    this.handleStructureChange()
  }

  /**
   * The last created node for the mission.
   */
  public lastCreatedNode: ClientMissionNode | null

  /**
   * Cache for tracking possible locations for creating a new node based on the node creation target.
   */
  protected _nodeCreators: NodeCreator[]
  /**
   * Cache for tracking possible locations for creating a new node based on the node creation target.
   */
  public get nodeCreators(): NodeCreator[] {
    return this._nodeCreators
  }

  /**
   * Tracks the last opened node on the mission. Updated by the ClientMissionNode.open method.
   */
  public lastOpenedNode: ClientMissionNode | null

  /**
   * The lines used to draw relationships between prototypes on a mission map.
   * @note Calculated in `ClientMissionPrototype.drawPrototypeRelationshipLines`.
   */
  public relationshipLines: TWithKey<TLine_P>[]

  // Implemented
  public get mission(): ClientMission {
    return this
  }

  // Implemented
  public get path(): TMissionNavigable[] {
    return [this]
  }

  // Implemented
  public get nodes(): ClientMissionNode[] {
    return this.forces.map((force) => force.nodes).flat()
  }

  public constructor(
    data: Partial<TCommonMissionJson> = {},
    options: TClientMissionOptions = {},
  ) {
    // Initialize base properties.
    super(data, options)

    // Parse client-specific options.
    let { existsOnServer = false } = options

    // Initialize client-specific properties.
    this._existsOnServer = existsOnServer
    this._depth = -1
    this._structureChangeKey = generateHash()
    this.lastCreatedNode = null
    this.listeners = []
    this._selectedNode = null
    this._selectedForce = null
    this._selection = this
    this._nodeCreators = []
    this.relationshipLines = []
    this.lastOpenedNode = null

    // If there is no existing nodes,
    // create one.
    if (this.prototypes.length === 0) {
      this.spawnPrototype()
    }

    // Mark as initialized.
    this.structureInitialized = true

    // Initialize structure.
    this.handleStructureChange()
  }

  // Implemented
  protected parseForceData(
    data: TCommonMissionForceJson[],
  ): ClientMissionForce[] {
    return data.map((datum) => new ClientMissionForce(this, datum))
  }

  // Implemented
  protected createRootPrototype(): ClientMissionPrototype {
    return new ClientMissionPrototype(this, 'ROOT')
  }

  /**
   * Handles a change in the mission's structure, anything that
   * would change the structure of the mission's node tree.
   */
  public handleStructureChange(): void {
    // Do not handle structure changes
    // until the structure is properly
    // initialized by the constructor.
    if (!this.structureInitialized) {
      return
    }

    // Update the key for tracking
    // changes.
    this._structureChangeKey = generateHash()

    // Re-position the prototypes to ensure
    // their current positions reflect
    // all the changes that have been
    // made.
    this.positionPrototypes()

    // Re-position the node creators
    // to ensure their current positions
    // reflect all the changes that have
    // been made.
    if (this.creationMode) {
      this.positionNodeCreators()
    }

    // Draw the relationship lines
    // between nodes.
    this.drawRelationshipLines()

    // Draw the relationship lines
    // between nodes in forces.
    this.forces.forEach((force) => {
      force.handleStructureChange()
    })

    // Emit the structure change event.
    this.emitEvent('structure-change')
  }

  /**
   * Emits an event for the mission.
   * @param method The method of the event to emit.
   */
  protected emitEvent(method: TMissionEvent): void {
    // Call any matching listener callbacks
    // or any activity listener callbacks.
    for (let [listenerEvent, listenerCallback] of this.listeners) {
      if (listenerEvent === method || listenerEvent === 'activity') {
        listenerCallback()
      }
    }
  }

  // Implemented
  public addEventListener(
    method: TMissionEvent,
    callback: () => void,
  ): ClientMission {
    this.listeners.push([method, callback])
    return this
  }

  // Implemented
  public removeEventListener(callback: () => void): ClientMission {
    // Filter out listener.
    this.listeners = this.listeners.filter(([, h]) => h !== callback)
    return this
  }

  /**
   * This will position all the prototypes in the mission
   * for rendering on a mission map.
   * @param parent Recursively used. Don't pass anything.
   * @param depth Recursively used. Don't pass anything.
   * @param rowCount Recursively used. Don't pass anything.
   * @param extraLines Recursively used. Don't pass anything.
   * @param rowMostLinesFound Recursively used. Don't pass anything.
   * @returns Subcalls of this recursive function will return results used for
   * further position calculations. The final return can be ignored.
   */
  protected positionPrototypes(
    parent: ClientMissionPrototype = this.root,
    depth: number = -1,
    rowCount: Counter = new Counter(0),
  ): void {
    let creationTarget: ClientMissionPrototype | null = null

    // // If creation mode is enabled, set the
    // // nodeCreationTarget to the selected node.
    // if (this.creationMode) creationTarget = this.selectedNode!

    // If the parent node isn't the rootNode,
    // then this function was recursively
    // called with a reference to a particular
    // node in the mission. This node should be
    // included in the nodeData for the
    //  missionRender so that it displays.
    if (parent._id !== this.root._id) {
      parent.position.set(
        depth * ClientMissionNode.COLUMN_WIDTH,
        rowCount.count * ClientMissionNode.ROW_HEIGHT,
      )
    }
    // Else the depth of the mission is reset
    // for recalculation.
    else {
      this._depth = -1
    }

    // Set the depth of the parent node.
    parent.depth = depth

    // If the nodeCreationTarget is this parent,
    // the positioning is offset to account for the
    // node creators that must be rendered.
    // todo: Determine what to do with this.
    // if (creationTarget?._id === parent._id) {
    //   depth++
    // }

    let children = parent.children

    // If the nodeCreationTarget is a child of the
    // parent, the positioning is offset to account
    // for the node creators that must be rendered.
    // todo: Determine what to do with this.
    // for (let childNode of children) {
    //   if (creationTarget?._id === childNode._id) {
    //     depth += 1
    //   }
    // }

    // The childNodes should then be examined
    // by recursively calling this function.
    children.forEach((child: ClientMissionPrototype, index: number) => {
      if (index > 0) {
        rowCount.increment()
      }

      // If the nodeCreationTarget is this childNode,
      // the positioning is offset to account for the
      // node creators that must be rendered.
      // todo: Determine what to do with this.
      // if (creationTarget?._id === child._id) {
      //   rowCount.increment()
      // }

      // Position the child node.
      this.positionPrototypes(
        child,
        // todo: Determine what to do with this.
        depth + 1, // + child.depthPadding,
        rowCount,
      )

      // todo: Determine what to do with this.
      // // If the nodeCreationTarget is this childNode,
      // // the positioning is offset to account for the
      // // node creators that must be rendered.
      // if (creationTarget?._id === childNode._id) {
      //   rowCount.increment()
      // }
    })

    // This will increase the mission depth
    // if a node is found with a greater depth
    // than what's currently set.
    if (this._depth < depth) {
      this._depth = depth
    }
  }

  /**
   * This will position all the nodes creators with mapX and mapY
   * values that correspond with the current state of the mission.
   */
  protected positionNodeCreators = (): void => {
    let nodeCreationTarget: ClientMissionNode | null = null
    let nodeCreators: Array<NodeCreator> = this.nodeCreators

    // If creation mode is enabled, set the
    // nodeCreationTarget to the selected node.
    if (this.creationMode) nodeCreationTarget = this.selectedNode!

    if (nodeCreationTarget !== null) {
      for (let nodeCreator of nodeCreators) {
        nodeCreator.syncPosition()
      }
    }
  }

  /**
   * Draws the relationship lines between prototypes on the mission map
   * and caches them in the `relationshipLines` property.
   */
  protected drawRelationshipLines(): void {
    // The relationship lines drawn.
    let relationshipLines: TWithKey<TLine_P>[] = []
    // Define the distance between the edge of a
    // node and the edge of the column.
    let columnEdgeDistance: number =
      (ClientMissionNode.COLUMN_WIDTH - ClientMissionNode.WIDTH) / 2
    // Get half the default node height.
    const halfDefaultNodeHeight: number =
      ClientMissionNode.DEFAULT_NAME_NEEDED_HEIGHT / 2 +
      ClientMissionNode.VERTICAL_PADDING
    let creationTarget: ClientMissionNode | null = this.creationTarget
    let nodeCreators: NodeCreator[] = this.nodeCreators

    // Recursive algorithm used to determine the
    // relationship lines between nodes. Does not
    // draw the lines between node creators and nodes.
    const baseAlgorithm = (parent: ClientMissionPrototype = this.root) => {
      // Get details.
      let children: ClientMissionPrototype[] = parent.children
      let firstChild: ClientMissionPrototype | null = parent.firstChild
      let lastChild: ClientMissionPrototype | null = parent.lastChild
      let childCount: number = children.length

      // If the parent is not the invisible root node
      // in the mission and the parent has children,
      // then a relationship line should be drawn
      // between the parent and the edge of the
      // column.
      if (parent !== this.root && childCount > 0) {
        // ! line-draw-start

        // Clone the parent node's position then translate
        // the start position to the middle of the right edge of
        // the parent node.
        let parentToMidStart: Vector2D = parent.position
          .clone()
          .translateX(ClientMissionNode.WIDTH / 2)
          .translateY(halfDefaultNodeHeight)

        // Push a new line.
        relationshipLines.push({
          key: `parent-to-middle_${parent._id}`,
          direction: 'horizontal',
          start: parentToMidStart,
          // The length of the line is the distance
          // between the edge of the parent node and
          // the edge of the column.
          length: columnEdgeDistance,
        })

        // ! line-draw-end

        // ! math-start

        // Define the min and max y values
        // for the children of this parent node.
        let childMinY: number = parent.position.y
        let childMaxY: number = parent.position.y

        // If there is a first child, calculate
        // the min y value.
        if (firstChild) {
          // Set the min y value to the first child's
          // y position.
          childMinY = firstChild.position.y

          // If the firstChild is the creation target,
          // the min y value may need to be offset to
          // account for a previous sibling node creator.
          // todo: Determine what to do with this.
          // if (firstChild === creationTarget) {
          //   for (let creator of nodeCreators) {
          //     if (
          //       creator.targetRelation ===
          //       ENodeTargetRelation.PreviousSiblingOfTarget
          //     ) {
          //       childMinY = Math.min(childMinY, creator.position.y)
          //     }
          //   }
          // }
        }

        // If there is a last child, calculate
        // the max y value.
        if (lastChild) {
          // Set the max y value to the last child's
          // y position.
          childMaxY = lastChild.position.y

          // If the lastChild is the creation target,
          // the max y value may need to be offset to
          // account for a following sibling node creator.
          // todo: Determine what to do with this.
          // if (lastChild === creationTarget) {
          //   for (let creator of nodeCreators) {
          //     if (
          //       creator.targetRelation ===
          //       ENodeTargetRelation.FollowingSiblingOfTarget
          //     ) {
          //       childMaxY = Math.max(childMaxY, creator.position.y)
          //     }
          //   }
          // }
        }

        // ! math-end

        // ! line-draw-start

        // If the child min y value is not equal to
        // the child max y value, then a vertical
        // line should be drawn between the min and
        // max y values.
        if (childMinY !== childMaxY) {
          // Determine the start position of the vertical line.
          let downMidStart = parentToMidStart
            // First clone the parent to mid
            // start position.
            .clone()
            // Then translate to the edge of
            // the column.
            .translateX(columnEdgeDistance)
          // Then set the y position to the
          // min y value.
          downMidStart.y = childMinY
          // Then translate down by half the
          // default node height.
          downMidStart.translateY(halfDefaultNodeHeight)

          // Determine the length of the vertical line.
          let downMidLength: number = childMaxY - childMinY

          // If the parent node is the node creation target,
          // the vertical line should be offset to account
          // for a node creator between the parent and child.
          if (creationTarget?._id === parent._id) {
            downMidStart.translateX(ClientMissionNode.COLUMN_WIDTH)
          }

          // Push a new line.
          relationshipLines.push({
            key: `down-middle_${parent._id}`,
            direction: 'vertical',
            start: downMidStart,
            length: downMidLength,
          })
        }

        // ! line-draw-end

        // Iterate through the children.
        for (let child of children) {
          // ! line-draw-start

          // Draw a line from the right edge of the parent column
          // to the middle-y of the left edge of the child node.

          // Define the start position.
          let midToChildStart: Vector2D = parentToMidStart
            // First clone the parent to mid
            // start position.
            .clone()
            // Then translate to the edge of
            // the column.
            .translateX(columnEdgeDistance)
          // Then set the y position to the
          // child y value.
          midToChildStart.y = child.position.y
          // Then translate down by half the
          // default node height.
          midToChildStart.translateY(halfDefaultNodeHeight)
          // If the parent node is the node creation target,
          // the start position should be offset to account
          // for a node creator between the parent and child.
          if (creationTarget?._id === parent._id) {
            midToChildStart.translateX(ClientMissionNode.COLUMN_WIDTH)
          }

          // Define the end position.
          let midToChildEnd: Vector2D = child.position
            // First clone the child's position.
            .clone()
            // Then translate to the left edge of the node,
            // and down by half the default node height.
            .translate(-ClientMissionNode.WIDTH / 2, halfDefaultNodeHeight)

          // Determine the length of the from the difference
          // between the x values of the start and end positions.
          let midToChildLength: number = midToChildEnd.x - midToChildStart.x

          // Push the new line.
          relationshipLines.push({
            key: `middle-to-child_${child._id}`,
            direction: 'horizontal',
            start: midToChildStart,
            length: midToChildLength,
          })

          // ! line-draw-end
        }
      }

      // Iterate through the child nodes.
      for (let child of parent.children) {
        // Call recursively the algorithm with
        // the child.
        baseAlgorithm(child)
      }
    }

    // Run the algorithm.
    baseAlgorithm()

    // If the mission is in creation mode, add
    // the relationship lines for the node creators.
    if (this.creationMode && creationTarget) {
      // Loop through creators.
      for (let creator of this.nodeCreators) {
        // Gather details.
        let relation: ENodeTargetRelation = creator.targetRelation
        let relationIsSibling: boolean =
          relation === ENodeTargetRelation.PreviousSiblingOfTarget ||
          relation === ENodeTargetRelation.FollowingSiblingOfTarget

        // ! line-draw-start

        // If the relation is a parent-only relationship, and the
        // target's parent is the root node, draw a line from the
        // creator to the target.
        if (
          relation === ENodeTargetRelation.ParentOfTargetOnly
          // todo: Reimplement this.
          // && creationTarget.parent === this.rootNode
        ) {
          // Define start position.
          let start: Vector2D = creator.position
            // First clone the creator's position.
            .clone()
            // Then translate to the edge of the creator,
            // and down by half the default node height.
            .translate(ClientMissionNode.WIDTH / 2, halfDefaultNodeHeight)
          // Define length of line.
          let length: number = columnEdgeDistance * 2

          // Push a new line.
          relationshipLines.push({
            key: `creator-to-target_${creator.nodeId}`,
            direction: 'horizontal',
            start,
            length,
          })
        }

        // ! line-draw-end

        // ! line-draw-start

        // If the relation is a between-target-and-children
        // relationship, then draw a line from the target
        // to the creator.
        if (relation === ENodeTargetRelation.BetweenTargetAndChildren) {
          // Define start position.
          let start: Vector2D = creationTarget.prototype.position
            // First clone the target's position.
            .clone()
            // Then translate to the edge of the node,
            // and down by half the default node height.
            .translate(ClientMissionNode.WIDTH / 2, halfDefaultNodeHeight)
          // Define length of line.
          let length: number = columnEdgeDistance

          // If the target has children, the line should be
          // longer to account for the children.
          if (creationTarget.hasChildren) {
            length += ClientMissionNode.COLUMN_WIDTH
          }
          // Else, add the edge distance to connect it
          // with the creator, only.
          else {
            length += columnEdgeDistance
          }

          // Push a new line.
          relationshipLines.push({
            key: `target-to-creator_${creator.nodeId}`,
            direction: 'horizontal',
            start,
            length,
          })
        }

        // ! line-draw-end

        // ! line-draw-start

        // If the relation is a sibling relationship, the target has
        // a parent, which is not the root node, draw a line
        // from the target's parent to the creator.
        if (
          relationIsSibling &&
          creationTarget.parent
          // todo: Reimplement this.
          // && creationTarget.parent !== this.rootNode
        ) {
          // Define start position.
          let start: Vector2D = creationTarget.parent.prototype.position
            // First clone the target-parent's position.
            .clone()
            // Then translate to the right edge of the column.
            .translateX(ClientMissionNode.COLUMN_WIDTH / 2)
          // Set the y position to the creator's y position.
          start.y = creator.position.y
          // Then translate down by half the default node height.
          start.translateY(halfDefaultNodeHeight)

          // Define end position.
          let end: Vector2D = creator.position
            // First clone the creator's position.
            .clone()
            // Then translate to the edge of the creator,
            // and down by half the default node height.
            .translate(ClientMissionNode.WIDTH / 2, halfDefaultNodeHeight)

          // Define length of line by the difference
          // between the x values of the start and end
          // positions.
          let length: number = end.x - start.x

          // Push a new line.
          relationshipLines.push({
            key: `parent-to-creator_${creator.nodeId}`,
            direction: 'horizontal',
            start,
            length,
          })
        }

        // ! line-draw-end
      }
    }

    // Set the relationship lines in the mission to
    // those determined by the algorithm.
    this.relationshipLines = relationshipLines
  }

  /**
   * Selects an element within the mission.
   * @param selection The selection to make for the mission.
   * @note Selection can be accessed via non-static field `ClientMission.selection`.
   */
  public select(selection: TMissionNavigable): void {
    // Throw an error if the selection is not
    // part of the mission.
    if (selection.mission !== this)
      throw new Error('The given selection is not part of the mission.')

    this._selection = selection
    this.emitEvent('selection')
  }

  /**
   * Deselects the current selection, if any, selecting the
   * mission itself.
   */
  public deselect(): void {
    this._selection = this
    this.emitEvent('selection')
  }

  /**
   * Selects the parent of the current selection, if any.
   */
  public selectBack(): void {
    // Get the selection and its path.
    let selection = this.selection
    let selectionPath = selection.path

    // If the path has more than one element,
    // select the second-to-last element.
    if (selectionPath.length > 1) {
      this.select(selectionPath[selectionPath.length - 2])
    }
  }

  // Implemented
  public spawnPrototype(
    _id?: string,
    options: TMissionPrototypeOptions<ClientMissionPrototype> = {},
  ): ClientMissionPrototype {
    let rootPrototype: ClientMissionPrototype | null = this.root

    // If the mission has no root prototype, throw an error.
    if (rootPrototype === null) {
      throw new Error('Cannot spawn prototype: Mission has no root prototype.')
    }

    // If no id is provided, generate a new id.
    if (_id === undefined) _id = StringToolbox.generateRandomId()

    // Create new prototype.
    let prototype: ClientMissionPrototype = new ClientMissionPrototype(
      this,
      _id,
      options,
    )

    // Set the parent prototype to the root
    // prototype.
    prototype.parent = rootPrototype
    // Add the prototype to the root prototype's
    // children.
    rootPrototype.children.push(prototype)
    // Add the prototype to the prototype list.
    this.prototypes.push(prototype)

    // Emit spawn node event if the structure
    // has been initialized.
    if (this.structureInitialized) {
      this.emitEvent('spawn-node')
    }

    // Return the prototype.
    return prototype
  }

  /**
   * Creates a new force for the mission.
   * @param data
   * @param options
   * @returns The newly created force.
   */
  public createForce(options: TMissionForceOptions = {}): ClientMissionForce {
    // Throw an error if the max number of forces
    // has already been reached.
    if (this.forces.length >= Mission.MAX_FORCE_COUNT) {
      throw new Error('Max number of forces already reached.')
    }

    // Organize existing force data for algorithm.
    let existingForceNames: string[] = this.forces.map(({ name }) => name)
    let existingForceColors: string[] = this.forces.map(({ color }) => color)

    // Predefine force.
    let force: ClientMissionForce | null = null

    // Loop through default forces, and find
    // the next available default force.
    for (let defaultForce of MissionForce.DEFAULT_FORCES) {
      if (
        existingForceNames.includes(defaultForce.name) ||
        existingForceColors.includes(defaultForce.color)
      ) {
        continue
      }

      // Create a new force.
      force = new ClientMissionForce(this, defaultForce, options)
      // Break the loop.
      break
    }

    // This theoretically shouldn't happen, but if
    // no force has been created yet, create one here.
    if (!force) force = new ClientMissionForce(this, {}, options)

    // Add the force to the mission.
    this.forces.push(force)

    // Handle structure change.
    this.handleStructureChange()

    // Return the force.
    return force
  }

  /**
   * Commit any changes made and save them to the server. Calls
   * @note Chooses between post and put based on the state of the `existsOnServer`
   * property. This can be set as an option in the constructor.
   * @returns Promise<void> A promise that resolves when the operation is complete.
   */
  public async saveToServer(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Create a new mission if it doesn't
        // exist already.
        if (!this.existsOnServer) {
          let { data } = await axios.post<
            any,
            AxiosResponse<Required<TCommonMissionJson>>
          >(ClientMission.API_ENDPOINT, this.toJson())
          // Update the temporary client-generated
          // mission ID and seed with the server-generated
          // mission ID and seed.
          this._id = data._id
          this.seed = data.seed
          // Update existsOnServer to true.
          this._existsOnServer = true
        }
        // Update the mission if it does exist.
        else {
          await axios.put(ClientMission.API_ENDPOINT, this.toJson())
        }
        resolve()
      } catch (error) {
        console.error('Failed to save mission.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Determines the selected node from the mission selection passed.
   * @param selection The selection in a mission.
   * @returns The node, if any.
   * @note `null` is returned if no node is selected for the given
   * selection.
   */
  public static getNodeFromSelection(
    selection: TMissionNavigable,
  ): ClientMissionNode | null {
    // Loop through path, and return the first node found.
    for (let item of selection.path) {
      if (item instanceof ClientMissionNode) return item
    }
    // Return null if no node is found.
    return null
  }

  /**
   * Determines the selected force from the mission selection passed.
   * @param selection The selection in a mission.
   * @returns The force, if any.
   * @note `null` is returned if no force is selected for the given
   * selection.
   */
  public static getForceFromSelection(
    selection: TMissionNavigable,
  ): ClientMissionForce | null {
    // Loop through path, and return the first force found.
    for (let item of selection.path) {
      if (item instanceof ClientMissionForce) return item
    }
    // Return null if no force is found.
    return null
  }

  /* -- API -- */

  /**
   * The API endpoint for mission data on the METIS server.
   */
  public static API_ENDPOINT: string = `/api/v1/missions`

  /* -- API | CREATE -- */

  /**
   * Imports missions from .metis files, returns a Promise that resolves with the results of the import.
   * @param files The .metis files to import.
   * @resolves The result of the import.
   * @rejects The error that occurred during the import.
   */
  public static $import(
    files: FileList | File[],
  ): Promise<TMissionImportResult> {
    return new Promise<TMissionImportResult>(async (resolve, reject) => {
      try {
        const formData = new FormData()

        for (let file of files) {
          formData.append('files', file)
        }

        let { data: result } = await axios.post<
          any,
          AxiosResponse<TMissionImportResult>
        >(`/api/v1/missions/import/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        resolve(result)
      } catch (error) {
        console.error('Failed to import mission(s).')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Copy a mission and create a new mission with the same structure.
   * @param originalId The ID of the mission to copy.
   * @param copyName The name for the mission copy.
   * @param options Options for the creation of the Mission object returned.
   * @resolves The new mission copy.
   * @rejects The error that occurred during the copy.
   */
  public static $copy(
    originalId: ClientMission['_id'],
    copyName: ClientMission['name'],
    options: TExistingClientMissionOptions = {},
  ): Promise<ClientMission> {
    return new Promise<ClientMission>(async (resolve, reject) => {
      try {
        let { data } = await axios.put<any, AxiosResponse<TCommonMissionJson>>(
          `${ClientMission.API_ENDPOINT}/copy/`,
          {
            originalId,
            copyName,
          },
        )
        options.existsOnServer = true
        resolve(new ClientMission(data, options))
      } catch (error) {
        console.error('Failed to copy mission.')
        console.error(error)
        reject(error)
      }
    })
  }

  /* -- API | READ -- */

  /**
   * Calls the API to fetch one mission by its mission ID.
   * @param _id The ID of the mission to fetch.
   * @param options Options for the creation of the Mission object returned.
   * @resolves The Mission object fetched from the server.
   * @rejects The error that occurred during the fetch.
   */
  public static $fetchOne(
    _id: ClientMission['_id'],
    options: TExistingClientMissionOptions = {},
  ): Promise<ClientMission> {
    return new Promise<ClientMission>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data } = await axios.get<TCommonMissionJson>(
          `${ClientMission.API_ENDPOINT}/${_id}/`,
        )
        // Update options.
        options.existsOnServer = true
        // Convert JSON to ClientMission object.
        let mission: ClientMission = new ClientMission(data, options)
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
   * @param options Options for the creation of the Mission objects returned.
   * @resolves An array of Mission objects fetched from the server.
   * @rejects The error that occurred during the fetch.
   */
  public static $fetchAll(
    options: TExistingClientMissionOptions = {},
  ): Promise<ClientMission[]> {
    return new Promise<ClientMission[]>(async (resolve, reject) => {
      try {
        let { data } = await axios.get<TCommonMissionJson[]>(
          ClientMission.API_ENDPOINT,
        )
        // Update options.
        options.existsOnServer = true
        // Convert JSON to ClientMission objects.
        resolve(data.map((datum) => new ClientMission(datum, options)))
      } catch (error) {
        console.error('Failed to fetch missions.')
        console.error(error)
        reject(error)
      }
    })
  }

  /* -- API | DELETE -- */

  /**
   * Deletes the mission with the given ID.
   * @param _id The ID of the mission to delete.
   * @resolves The mission was successfully deleted.
   * @rejects The error that occurred during the deletion.
   */
  public static $delete(_id: ClientMission['_id']): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await axios.delete(`${ClientMission.API_ENDPOINT}/${_id}/`)
        resolve()
      } catch (error) {
        console.error('Failed to delete mission.')
        console.error(error)
        reject(error)
      }
    })
  }
}

/* ------------------------------ CLIENT MISSION TYPES ------------------------------ */

/**
 * Client types for Mission objects.
 * @note Used as a generic argument for all client,
 * mission-related classes.
 */
export interface TClientMissionTypes extends TCommonMissionTypes {
  mission: ClientMission
  force: ClientMissionForce
  prototype: ClientMissionPrototype
  node: ClientMissionNode
  action: ClientMissionAction
  execution: ClientActionExecution
  outcome: ClientActionOutcome
  targetEnv: ClientTargetEnvironment
  target: ClientTarget
  effect: ClientEffect
}

/**
 * Options for the creation of a ClientMission object.
 */
export type TClientMissionOptions = TMissionOptions & {
  /**
   * Whether the data already exists on the server.
   * @default false
   */
  existsOnServer?: boolean
}

/**
 * Options for the creation of a ClientMission object when the mission is known to exist on the server.
 */
export type TExistingClientMissionOptions = TClientMissionOptions & {
  /**
   * Overrides the existsOnServer option from `TClientMissionOptions` to true.
   * @default true
   */
  existsOnServer?: true
}

/**
 * Results of a mission import via the ClientMission.importMissions method.
 */
export type TMissionImportResult = {
  /**
   * The number of missions successfully imported.
   */
  successfulImportCount: number
  /**
   * The number of missions that failed to import.
   */
  failedImportCount: number
  /**
   * The error messages and file names for the missions that failed to import.
   */
  failedImportErrorMessages: Array<{ fileName: string; errorMessage: string }>
}

/**
 * A function that handles a change in the mission's structure.
 */
export type TStructureChangeListener = (structureChangeKey: string) => void

/**
 * An event that occurs on a node, which can be listened for.
 * @option 'activity'
 * Triggered when any other event occurs.
 * @option 'structure-change'
 * Triggered when the structure of the mission, including the nodes and actions
 * that make up the mission, change.
 * @option 'node-selection'
 * Triggered when a node is selected or deselected.
 * @option 'spawn-node'
 * Triggered when a node is spawned after initialization.
 * @option 'new-force'
 * Triggered when a new force is created.
 */
export type TMissionEvent =
  | 'activity'
  | 'structure-change'
  | 'selection'
  | 'spawn-node'

/**
 * Represents an object that can support navigation within
 * a mission.
 * @note Implement this to make a class compatible.
 */
export interface TMissionNavigable {
  /**
   * The mission associated with the object.
   */
  mission: ClientMission
  /**
   * The name of the object.
   */
  name: string
  /**
   * The path to object within the mission.
   */
  get path(): TMissionNavigable[]
}
