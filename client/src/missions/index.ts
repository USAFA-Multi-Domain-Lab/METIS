import axios, { AxiosResponse } from 'axios'
import { TMetisClientComponents } from 'src'
import { TListItem } from 'src/components/content/data/lists/pages/ListItem'
import { TLine_P } from 'src/components/content/session/mission-map/objects/Line'
import { TPrototypeSlot_P } from 'src/components/content/session/mission-map/objects/PrototypeSlot'
import ClientFileReference from 'src/files/references'
import { v4 as generateHash } from 'uuid'
import { TListenerTargetEmittable } from '../../../shared/events'
import { TFileReferenceJson } from '../../../shared/files/references'
import Mission, {
  TMissionComponent,
  TMissionJson,
} from '../../../shared/missions'
import { TMissionActionJson } from '../../../shared/missions/actions'
import { TEffectJson } from '../../../shared/missions/effects'
import {
  MissionForce,
  TMissionForceSaveJson,
} from '../../../shared/missions/forces'
import { TMissionNodeJson } from '../../../shared/missions/nodes'
import {
  TMissionPrototypeJson,
  TMissionPrototypeOptions,
} from '../../../shared/missions/nodes/prototypes'
import { TNonEmptyArray } from '../../../shared/toolbox/arrays'
import { Counter } from '../../../shared/toolbox/numbers'
import { AnyObject, TWithKey } from '../../../shared/toolbox/objects'
import { Vector2D } from '../../../shared/toolbox/space'
import User from '../../../shared/users'
import ClientMissionAction from './actions'
import { ClientEffect } from './effects'
import ClientMissionForce from './forces'
import ClientMissionNode from './nodes'
import ClientMissionPrototype, { TPrototypeRelation } from './nodes/prototypes'
import MissionTransformation from './transformations'
import PrototypeCreation from './transformations/creations'
import PrototypeTranslation from './transformations/translations'

/**
 * Class for managing missions on the client.
 * @extends {Mission<ClientMissionNode>}
 */
export default class ClientMission
  extends Mission<TMetisClientComponents>
  implements TListenerTargetEmittable<TMissionEvent>, TListItem
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
   * Opts to have all nodes in the mission opened by default.
   */
  private _nonRevealedDisplayMode: TNonRevealedDisplayMode
  /**
   * Opts to have all nodes in the mission opened by default.
   */
  public get nonRevealedDisplayMode(): TNonRevealedDisplayMode {
    return this._nonRevealedDisplayMode
  }

  /**
   * The context in which the mission is being used.
   */
  private _context: TClientMissionContext | null = null
  /**
   * The context in which the mission is being used.
   */
  public get context(): TClientMissionContext | null {
    return this._context
  }
  public set context(value: TClientMissionContext | null) {
    if (value === 'edit') this._nonRevealedDisplayMode = 'show'
    this._context = value
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
   * The current selection for the mission.
   * @note This can be most type of nested, mission-related component,
   * such as nodes, forces, etc.
   * @note This is used in the form for editing.
   * @note By default, the mission itself.
   */
  private _selection: TMissionComponent<any, any>
  /**
   * The current selection for the mission.
   * @note This can be most type of nested, mission-related components,
   * such as nodes, forces, etc.
   * @note This is used in the form for editing.
   * @note By default, the mission itself.
   */
  public get selection(): TMissionComponent<any, any> {
    return this._selection
  }

  /**
   * The current transformation being done on the mission by
   * the user.
   */
  private _transformation: MissionTransformation | null
  /**
   * The current transformation being done on the mission by
   * the user.
   */
  public get transformation(): MissionTransformation | null {
    return this._transformation
  }
  public set transformation(value: MissionTransformation | null) {
    this._transformation = value
    this.emitEvent('set-transformation')
    this.handleStructureChange()
  }

  /**
   * The destination of the transformation, if any.
   * @note Determined from the transformation.
   */
  public get transformDestination(): ClientMissionPrototype | null {
    let transformation: MissionTransformation | null = this.transformation

    if (
      transformation instanceof PrototypeCreation ||
      transformation instanceof PrototypeTranslation
    ) {
      return transformation.destination
    } else {
      return null
    }
  }

  /**
   * Prototype slots to render on a mission map given the current
   * state of the mission transformation.
   */
  public get prototypeSlots(): TPrototypeSlot_P[] {
    let slots: TPrototypeSlot_P[] = []

    // If there is a transformation, it is a
    // prototype creation or translation, the
    // destination is selected, but the relation
    // is not, then add slots next to the destination.
    if (
      this.transformation &&
      (this.transformation instanceof PrototypeCreation ||
        this.transformation instanceof PrototypeTranslation) &&
      this.transformation.destination &&
      !this.transformation.relation
    ) {
      // Gather details.
      let transformation: PrototypeCreation | PrototypeTranslation =
        this.transformation
      let destination: ClientMissionPrototype = this.transformation.destination
      let slotRelations: TPrototypeRelation[] = [
        'parent-of-target-only',
        'between-target-and-children',
        'previous-sibling-of-target',
        'following-sibling-of-target',
      ]

      // Create a function to apply the transformation.
      const apply = (relation: TPrototypeRelation) => {
        // Set the relation of the transformation.
        transformation.relation = relation
        // Apply the transformation.
        transformation.apply()
        // Clear transformation.
        this.transformation = null
      }

      // Loop through relations and add slots.
      slots.push(
        ...slotRelations.map((relation) => ({
          relative: destination,
          relation,
          position: ClientMission.determineSlotPosition(destination, relation),
          onClick: () => apply(relation),
        })),
      )
    }

    return slots
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

  /**
   * The ID of the user that created the mission.
   */
  public get creatorId(): string {
    return 'admin'
  }

  /**
   * The first name of the user that created the mission.
   */
  public get creatorFirstName(): string {
    return 'admin'
  }

  /**
   * The last name of the user that created the mission.
   */
  public get creatorLastName(): string {
    return 'user'
  }

  /**
   * The full name of the user that created the mission.
   */
  public get creatorFullName(): string {
    return User.getFullName(this.creatorFirstName, this.creatorLastName)
  }

  /**
   * @param data The mission data from which to create the mission. Any ommitted values will be set to the default properties defined in Mission.DEFAULT_PROPERTIES.
   * @param options The options for creating the mission.
   */
  public constructor(
    data: Partial<TMissionJson> = ClientMission.DEFAULT_PROPERTIES,
    options: TClientMissionOptions = {},
  ) {
    // Initialize base properties.
    super(data)

    // Parse client-specific options.
    let { existsOnServer = false, nonRevealedDisplayMode = 'hide' } = options

    // Initialize client-specific properties.
    this._existsOnServer = existsOnServer
    this._depth = -1
    this._structureChangeKey = generateHash()
    this.listeners = []
    this._selection = this
    this._transformation = null
    this.relationshipLines = []
    this.lastOpenedNode = null
    this._nonRevealedDisplayMode = nonRevealedDisplayMode

    // If there is no existing prototypes,
    // create one.
    if (this.prototypes.length === 0) {
      this.importPrototype()
    }

    // Mark as initialized.
    this.structureInitialized = true

    // Initialize structure.
    this.handleStructureChange()
  }

  // Implemented
  protected importPrototype(
    data: Partial<TMissionPrototypeJson> = ClientMissionPrototype.DEFAULT_PROPERTIES,
    options: TMissionPrototypeOptions<ClientMissionPrototype> = {},
  ): ClientMissionPrototype {
    let rootPrototype: ClientMissionPrototype | null = this.root

    // If the mission has no root prototype, throw an error.
    if (rootPrototype === null) {
      throw new Error('Cannot import prototype: Mission has no root prototype.')
    }

    // Create new prototype.
    let prototype: ClientMissionPrototype = new ClientMissionPrototype(
      this,
      data,
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

    // Return the prototype.
    return prototype
  }

  // Implemented
  protected importForces(data: TMissionForceSaveJson[]): void {
    let forces: ClientMissionForce[] = data.map(
      (datum) => new ClientMissionForce(this, datum),
    )
    this.forces.push(...forces)
  }

  // Implemented
  protected importFiles(data: TFileReferenceJson[]): void {
    let files: ClientFileReference[] = data.map((datum) =>
      ClientFileReference.fromJson(datum),
    )
    this.files.push(...files)
  }

  /**
   * Imports previously omitted force and structure data
   * into the mission on session start.
   * @param forces The JSON data for the forces.
   * @param structure The JSON data for the structure.
   */
  public importStartData(
    structure: AnyObject,
    forces: TMissionForceSaveJson[],
    prototypes: TMissionPrototypeJson[],
  ): void {
    // Clear forces and prototypes.
    this.prototypes = []
    this.forces = []

    // Import structure.
    this.importStructure(structure, prototypes)
    // Import forces.
    this.importForces(forces)

    // Handle structure change.
    this.handleStructureChange()
  }

  // Implemented
  protected initializeRoot(): ClientMissionPrototype {
    return new ClientMissionPrototype(this, { _id: 'ROOT' })
  }

  /**
   * Creates a new prototype for the mission.
   * @param data Data passed to the prototype constructor.
   * @param options Options passed to the constructor.
   * @returns The newly created prototype.
   */
  public createPrototype(
    data: Partial<TMissionPrototypeJson> = ClientMissionPrototype.DEFAULT_PROPERTIES,
    options: TMissionPrototypeOptions<ClientMissionPrototype> = {},
  ): ClientMissionPrototype {
    let rootPrototype: ClientMissionPrototype | null = this.root

    // If the mission has no root prototype, throw an error.
    if (rootPrototype === null) {
      throw new Error('Cannot create prototype: Mission has no root prototype.')
    }

    // Create new prototype.
    let prototype: ClientMissionPrototype = new ClientMissionPrototype(
      this,
      data,
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

    // Handle event.
    this.handleStructureChange()
    this.emitEvent('new-prototype')

    // Return the prototype.
    return prototype
  }

  /**
   * Creates a new force for the mission.
   * @param data The JSON data for the force.
   * @param options Options passed to the constructor.
   * @returns The newly created force.
   */
  public createForce(): ClientMissionForce {
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
      force = new ClientMissionForce(this, defaultForce)
      // Break the loop.
      break
    }

    // This theoretically shouldn't happen, but if
    // no force has been created yet, create one here.
    if (!force) force = new ClientMissionForce(this, {})

    // Add the force to the mission.
    this.forces.push(force)

    // Handle structure change.
    this.handleStructureChange()

    // Return the force.
    return force
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

    // Draw the relationship lines
    // between prototypes.
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
  public emitEvent(method: TMissionEvent): void {
    // Call any matching listener callbacks
    // or any activity listener callbacks.
    for (let [listenerEvent, listenerCallback] of this.listeners) {
      if (listenerEvent === method || listenerEvent === 'activity') {
        listenerCallback()
      }
    }
  }

  // Implemented
  public addEventListener(method: TMissionEvent, callback: () => void) {
    this.listeners.push([method, callback])
  }

  // Implemented
  public removeEventListener(method: TMissionEvent, callback: () => void) {
    // Filter out listener.
    this.listeners = this.listeners.filter(
      ([m, h]) => m !== method || h !== callback,
    )
  }

  /**
   * This will position all the prototypes in the mission
   * for rendering on a mission map.
   * @param parent Recursively used. Don't pass anything.
   * @param depth Recursively used. Don't pass anything.
   * @param rowCount Recursively used. Don't pass anything.
   * @param buttonData Recursively used. Don't pass anything.
   * @returns Subcalls of this recursive function will return results used for
   * further position calculations. The final return can be ignored.
   */
  protected positionPrototypes(
    parent: ClientMissionPrototype = this.root,
    depth: number = -1,
    rowCount: Counter = new Counter(0),
    buttonData = { foundOnRow: false, rowCount: 0 },
  ): void {
    // Gather details.
    let transformDestination = this.transformDestination
    let yOffset: number = buttonData.rowCount * ClientMissionNode.BUTTONS_HEIGHT

    // If the parent node isn't the rootNode,
    // then this function was recursively
    // called with a reference to a particular
    // node in the mission. This node should be
    // included in the nodeData for the
    //  missionRender so that it displays.
    if (parent._id !== this.root._id) {
      parent.position.set(
        depth * ClientMissionNode.COLUMN_WIDTH,
        rowCount.count * ClientMissionNode.ROW_HEIGHT + yOffset,
      )
    }
    // Else the depth of the mission is reset
    // for recalculation.
    else {
      this._depth = -1
    }

    // Set the depth of the parent.
    parent.depth = depth

    // If the transformDestination is this parent,
    // the positioning is offset to account for the
    // prototype slots that must be rendered.
    if (transformDestination?._id === parent._id) {
      depth++
    }

    let children = parent.children

    // If the transformDestination is a child of the
    // parent, the positioning is offset to account
    // for the prototype slots that must be rendered.
    for (let childNode of children) {
      if (transformDestination?._id === childNode._id) {
        depth += 1
      }
    }

    // If the parent has buttons, mark buttons as found.
    if (parent.buttons.length > 0) {
      buttonData.foundOnRow = true
    }

    // The children should then be examined
    // by recursively calling this function.
    children.forEach((child: ClientMissionPrototype, index: number) => {
      if (index > 0) {
        rowCount.increment()

        // If buttons were found on row,
        // increment the row count.
        if (buttonData.foundOnRow) {
          buttonData.rowCount++
        }
        // Then clear found on row.
        buttonData.foundOnRow = false
      }

      // If the transformDestination is this child,
      // the positioning is offset to account for the
      // prototype slots that must be rendered.
      if (transformDestination?._id === child._id) {
        rowCount.increment()
      }

      // Position the child node.
      this.positionPrototypes(
        child,
        depth + 1 + child.depthPadding,
        rowCount,
        buttonData,
      )

      // If the transformDestination is this child,
      // the positioning is offset to account for the
      // prototype slots that must be rendered.
      if (transformDestination?._id === child._id) {
        rowCount.increment()
      }
    })

    // This will increase the mission depth
    // if a node is found with a greater depth
    // than what's currently set.
    if (this._depth < depth) {
      this._depth = depth
    }
  }

  /**
   * Draws the relationship lines between prototypes on the mission map
   * and caches them in the `relationshipLines` property.
   */
  protected drawRelationshipLines(): void {
    // Gather details.
    let transformDestination = this.transformDestination
    let slots = this.prototypeSlots
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

    // Recursive algorithm used to determine the
    // relationship lines between prototypes. Does not
    // draw the lines between slots and prototypes.
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

          // If the firstChild is the transform destination,
          // the min y value may need to be offset to
          // account for a previous sibling slot.
          if (firstChild._id === transformDestination?._id) {
            for (let slot of slots) {
              if (slot.relation === 'previous-sibling-of-target') {
                childMinY = Math.min(childMinY, slot.position.y)
              }
            }
          }
        }

        // If there is a last child, calculate
        // the max y value.
        if (lastChild) {
          // Set the max y value to the last child's
          // y position.
          childMaxY = lastChild.position.y

          // If the lastChild is the transform destination,
          // the max y value may need to be offset to
          // account for a following sibling slot.
          if (lastChild._id === transformDestination?._id) {
            for (let slot of slots) {
              if (slot.relation === 'following-sibling-of-target') {
                childMaxY = Math.max(childMaxY, slot.position.y)
              }
            }
          }
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

          // If the parent node is the node transform destination,
          // the vertical line should be offset to account
          // for a slot between the parent and child
          if (transformDestination?._id === parent._id) {
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
          // If the parent node is the node transform destination,
          // the start position should be offset to account
          // for a slot between the parent and child.
          if (transformDestination?._id === parent._id) {
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

      // Iterate through the child prototypes.
      for (let child of parent.children) {
        // Call recursively the algorithm with
        // the child.
        baseAlgorithm(child)
      }
    }

    // Run the algorithm.
    baseAlgorithm()

    // If the mission has a transform destination, add
    // the relationship lines for the slots.
    if (transformDestination) {
      // Loop through slots.
      for (let slot of slots) {
        // Gather details.
        let relation: TPrototypeRelation = slot.relation
        let relationIsSibling: boolean =
          relation === 'previous-sibling-of-target' ||
          relation === 'following-sibling-of-target'

        // ! line-draw-start

        // If the relation is a parent-only relationship, and the
        // target's parent is the root, draw a line from the
        // slot to the target.
        if (
          relation === 'parent-of-target-only' &&
          transformDestination.parent === this.root
        ) {
          // Define start position.
          let start: Vector2D = slot.position
            // First clone the slot's position.
            .clone()
            // Then translate to the edge of the slot,
            // and down by half the default node height.
            .translate(ClientMissionNode.WIDTH / 2, halfDefaultNodeHeight)
          // Define length of line.
          let length: number = columnEdgeDistance * 2

          // Push a new line.
          relationshipLines.push({
            key: `slot-to-target_${slot.relation}`,
            direction: 'horizontal',
            start,
            length,
          })
        }

        // ! line-draw-end

        // ! line-draw-start

        // If the relation is a between-target-and-children
        // relationship, then draw a line from the target
        // to the slot.
        if (relation === 'between-target-and-children') {
          // Define start position.
          let start: Vector2D = transformDestination.position
            // First clone the target's position.
            .clone()
            // Then translate to the edge of the prototype,
            // and down by half the default node height.
            .translate(ClientMissionNode.WIDTH / 2, halfDefaultNodeHeight)
          // Define length of line.
          let length: number = columnEdgeDistance

          // If the target has children, the line should be
          // longer to account for the children.
          if (transformDestination.hasChildren) {
            length += ClientMissionNode.COLUMN_WIDTH
          }
          // Else, add the edge distance to connect it
          // with the slot, only.
          else {
            length += columnEdgeDistance
          }

          // Push a new line.
          relationshipLines.push({
            key: `target-to-slot_${slot.relation}`,
            direction: 'horizontal',
            start,
            length,
          })
        }

        // ! line-draw-end

        // ! line-draw-start

        // If the relation is a sibling relationship, the target has
        // a parent, which is not the root, draw a line
        // from the target's parent to the slot.
        if (
          relationIsSibling &&
          transformDestination.parent &&
          transformDestination.parent !== this.root
        ) {
          // Define start position.
          let start: Vector2D = transformDestination.parent.position
            // First clone the target-parent's position.
            .clone()
            // Then translate to the right edge of the column.
            .translateX(ClientMissionNode.COLUMN_WIDTH / 2)
          // Set the y position to the slot's y position.
          start.y = slot.position.y
          // Then translate down by half the default node height.
          start.translateY(halfDefaultNodeHeight)

          // Define end position.
          let end: Vector2D = slot.position
            // First clone the slot's position.
            .clone()
            // Then translate to the edge of the slot,
            // and down by half the default node height.
            .translate(-ClientMissionNode.WIDTH / 2, halfDefaultNodeHeight)

          // Define length of line by the difference
          // between the x values of the start and end
          // positions.
          let length: number = end.x - start.x

          // Push a new line.
          relationshipLines.push({
            key: `parent-to-slot_${slot.relation}`,
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
  public select(selection: TMissionComponent<any, any>): void {
    // Throw an error if the selection is not
    // part of the mission.
    if (selection.mission !== this)
      throw new Error('The given selection is not part of the mission.')

    // If an action is selected when it's node is not
    // executable, select the mission instead.
    if (
      selection instanceof ClientMissionAction &&
      !selection.node.executable
    ) {
      selection = this
    }

    this._selection = selection

    this.emitEvent('selection')

    // If there is a transformation, clear it.
    if (this.transformation) this.transformation = null
  }

  /**
   * Deselects the current selection, if any, selecting the
   * mission itself.
   */
  public deselect(): void {
    this._selection = this
    this.emitEvent('selection')

    // If there is a transformation, clear it.
    if (this.transformation) this.transformation = null
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

    // If there is a transformation, clear it.
    if (this.transformation) this.transformation = null
  }

  /**
   * Duplicates the selected forces in the mission.
   * @param forcesInfo The information needed to duplicate the forces.
   * @returns The new, duplicated forces.
   */
  public duplicateForces(
    ...forcesInfo: TNonEmptyArray<TDuplicateForceInfo>
  ): TNonEmptyArray<ClientMissionForce> {
    // Duplicate the forces.
    let duplicatedForces = forcesInfo.map(({ originalId, duplicateName }) => {
      // Find the force to duplicate.
      let force = this.forces.find((force) => force._id === originalId)
      // Throw an error if the force is not found.
      if (!force) throw new Error(`Force with ID ${originalId} not found.`)

      // Convert the force to JSON.
      let forceJson = force.toJson()
      // Set the force's ID to the default ID (a random hash).
      forceJson._id = MissionForce.DEFAULT_PROPERTIES._id
      // Set the force's name to the duplicate name.
      forceJson.name = duplicateName

      // Determine what the next available color is.
      let existingColors = this.forces.map(({ color }) => color)
      let nextColor = MissionForce.DEFAULT_FORCES.find(
        ({ color }) => !existingColors.includes(color),
      )

      // Set the force's color to the next available color.
      forceJson.color =
        nextColor?.color || MissionForce.DEFAULT_PROPERTIES.color

      // Update the force's nodes.
      forceJson.nodes = forceJson.nodes.map((nodeJson: TMissionNodeJson) => {
        // Set the node's ID to a new ID.
        nodeJson._id = ClientMissionNode.DEFAULT_PROPERTIES._id
        // Update the node's actions.
        nodeJson.actions = nodeJson.actions.map(
          (actionJson: TMissionActionJson) => {
            // Set the action's ID to a new ID.
            actionJson._id = ClientMissionAction.DEFAULT_PROPERTIES._id
            // Update the action's effects.
            actionJson.effects = actionJson.effects.map(
              (effectJson: TEffectJson) => {
                // Set the effect's ID to a new ID.
                effectJson._id = ClientEffect.DEFAULT_PROPERTIES._id
                // Return the effect JSON.
                return effectJson
              },
            )
            // Return the action JSON.
            return actionJson
          },
        )
        // Return the node JSON.
        return nodeJson
      })

      // Create a new force object from the JSON.
      return new ClientMissionForce(this, forceJson)
    }) as TNonEmptyArray<ClientMissionForce>

    // Add the duplicated forces to the mission.
    this.forces.push(...duplicatedForces)

    // Handle structure change.
    this.handleStructureChange()

    return duplicatedForces
  }

  /**
   * Deletes the selected forces in the mission.
   * @param forceIds The IDs of the forces to delete.
   */
  public deleteForces(
    ...forceIds: TNonEmptyArray<ClientMissionForce['_id']>
  ): ClientMissionForce[] {
    let deletedForces: ClientMissionForce[] = []

    // If the forces is not an array, make it an array.
    if (!Array.isArray(forceIds)) forceIds = [forceIds]

    // Remove the forces from the mission.
    this.forces = this.forces.filter((force) => {
      let deleteIt = forceIds.includes(force._id)
      if (deleteIt) deletedForces.push(force)
      return !deleteIt
    })

    // Handle structure change.
    this.handleStructureChange()

    return deletedForces
  }

  /**
   * Sends all changes made to the server to be saved.
   * @resolves The mission was saved successfully.
   * @rejects The error that occurred during the save.
   * @note Chooses between post and put based on the state of the `existsOnServer`
   * property.
   */
  public async saveToServer(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Create a new mission if it doesn't
        // exist already.
        if (!this.existsOnServer) {
          // Create the mission on the server.
          let { data } = await axios.post<
            any,
            AxiosResponse<Required<TMissionJson>>
          >(
            ClientMission.API_ENDPOINT,
            this.toJson({
              idExposure: false,
            }),
          )
          // Update existsOnServer to true.
          this._existsOnServer = true
          // Update the mission ID, if necessary.
          if (data._id) this._id = data._id
        }
        // Update the mission if it does exist.
        else {
          // Update the mission with the current mission.
          await axios.put(ClientMission.API_ENDPOINT, this.toJson())
        }

        // Resolve.
        resolve()
      } catch (error: any) {
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
    selection: TMissionComponent<any, any>,
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
    selection: TMissionComponent<any, any>,
  ): ClientMissionForce | null {
    // Loop through path, and return the first force found.
    for (let item of selection.path) {
      if (item instanceof ClientMissionForce) return item
    }
    // Return null if no force is found.
    return null
  }

  /**
   * Determines the position of a prototype slot based on the
   * relation to a destination prototype.
   * @param destination The prototype which the slot is relative to.
   * @param relation The relation of the slot to the destination.
   * @returns The position of the slot.
   */
  public static determineSlotPosition(
    destination: ClientMissionPrototype,
    relation: TPrototypeRelation,
  ): Vector2D {
    let result: Vector2D = destination.position.clone()

    // Shift position and depth based on relation.
    switch (relation) {
      case 'parent-of-target-only':
        result.translateX(-1 * ClientMissionNode.COLUMN_WIDTH)
        break
      case 'between-target-and-children':
        result.translateX(1 * ClientMissionNode.COLUMN_WIDTH)
        break
      case 'previous-sibling-of-target':
        result.translateY(-1 * ClientMissionNode.ROW_HEIGHT)
        break
      case 'following-sibling-of-target':
        result.translateY(ClientMissionNode.ROW_HEIGHT)

        // If the destination has buttons, offset to
        // account for the buttons.
        if (destination.buttons.length > 0) {
          result.translateY(ClientMissionNode.BUTTONS_HEIGHT)
        }
        break
    }

    return result
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
        let { data } = await axios.put<any, AxiosResponse<TMissionJson>>(
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
        let { data } = await axios.get<TMissionJson>(
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
        let { data } = await axios.get<TMissionJson[]>(
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
 * Options for the creation of a ClientMission object.
 */
export type TClientMissionOptions = {
  /**
   * Whether the data already exists on the server.
   * @default false
   */
  existsOnServer?: boolean
  /**
   * If a node is available to the client, but has not technically
   * been revealed to the client, this option can be set to determine
   * how the node is displayed on the mission map.
   * @default 'hide'
   */
  nonRevealedDisplayMode?: TNonRevealedDisplayMode
}

/**
 * If a node is available to the client, but has not technically
 * been revealed to the client, this option can be set to determine
 * how the node is displayed on the mission map.
 */
export type TNonRevealedDisplayMode = 'hide' | 'blur' | 'show'

/**
 * A mission on the client-side is currently used either for editing
 * or for a session.
 * @note If the context is set to `edit`, all nodes need to be revealed to the client.
 * This means that the `nonRevealedDisplayMode` option will be set to 'show'.
 */
export type TClientMissionContext = 'session' | 'edit'

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
 * An event that occurs on a mission, which can be listened for.
 * @option 'activity'
 * Triggered when any event occurs.
 * @option 'structure-change'
 * Triggered when the structure of the mission, including the prototypes and actions
 * that make up the mission, change.
 * @option 'selection'
 * Triggered when a selection or deselection is made in the mission.
 * @option 'new-prototype'
 * Triggered when a new prototype is created.
 * @option 'buttons'
 * Triggered when buttons are set within any prototype or node.
 * @option 'set-transformation'
 * Triggered when a transformation is set for the mission.
 * @option 'autopan'
 * Triggered when nodes are opened and the mission map needs to auto-pan to them.
 */
export type TMissionEvent =
  | 'activity'
  | 'structure-change'
  | 'selection'
  | 'new-prototype'
  | 'set-buttons'
  | 'set-transformation'
  | 'autopan'

/**
 * The information needed to duplicate a force in a mission.
 */
type TDuplicateForceInfo = {
  /**
   * The ID of the force to duplicate.
   */
  originalId: string
  /**
   * The name of the duplicated force.
   */
  duplicateName: string
}
