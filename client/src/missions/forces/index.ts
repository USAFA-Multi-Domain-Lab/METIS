import { TLine_P } from 'src/components/content/session/mission-map/objects/Line'
import { TEventListenerTarget } from 'src/toolbox/hooks'
import ClientMission, {
  TClientMissionTypes,
  TMissionComponent,
  TMissionNavigable,
} from '..'
import {
  MissionForce,
  TMissionForceJson,
  TMissionForceOptions,
} from '../../../../shared/missions/forces'
import { TCommonOutputJson } from '../../../../shared/missions/forces/output'
import {
  TMissionNodeJson,
  TMissionNodeOptions,
} from '../../../../shared/missions/nodes'
import { Counter } from '../../../../shared/toolbox/numbers'
import { TWithKey } from '../../../../shared/toolbox/objects'
import { Vector2D } from '../../../../shared/toolbox/space'
import ClientMissionAction from '../actions'
import ClientMissionNode from '../nodes'
import ClientOutput from './output'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ClientMissionForce
  extends MissionForce<TClientMissionTypes>
  implements TEventListenerTarget<TForceEventMethod>, TMissionComponent
{
  /**
   * The lines used to connect nodes on the mission map.
   */
  public relationshipLines: TWithKey<TLine_P>[]

  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this]
  }

  /**
   * The message to display when the force is defective.
   */
  private _defectiveMessage: string
  /**
   * The message to display when the force is defective.
   */
  public get defectiveMessage(): string {
    return this._defectiveMessage
  }
  /**
   * Listeners for force events.
   */
  private listeners: Array<[TForceEventMethod, () => void]> = []

  /**
   * All actions that exist in the force.
   */
  public get actions(): Map<string, ClientMissionAction> {
    let actions = new Map<string, ClientMissionAction>()

    for (let node of this.nodes) {
      for (let action of node.actions.values()) {
        actions.set(action._id, action)
      }
    }

    return actions
  }

  /**
   * @param mission The mission to which the force belongs.
   * @param data The force data from which to create the force. Any ommitted
   * values will be set to the default properties defined in
   * MissionForce.DEFAULT_PROPERTIES.
   * @param options The options for creating the force.
   */
  public constructor(
    mission: ClientMission,
    data: Partial<TMissionForceJson> = MissionForce.DEFAULT_PROPERTIES,
    options: TClientMissionForceOptions = {},
  ) {
    super(mission, data, options)
    this.relationshipLines = []
    this._defectiveMessage = ''

    // If output data is provided, parse it.
    if (data.outputs) this._outputs = this.parseOutputs(data.outputs)
  }

  /**
   * Evaluates if the force is defective or not.
   * @returns boolean indicating if the force is defective or not.
   */
  public isDefective(): boolean {
    return false
  }

  // Implemented
  public createNode(
    data: Partial<TMissionNodeJson>,
    options: TMissionNodeOptions = {},
  ): ClientMissionNode {
    return new ClientMissionNode(this, data, options)
  }

  /**
   * Handles a change in the mission's structure, anything that
   * would change the structure of the mission's node tree.
   */
  public handleStructureChange(): void {
    // Loop through prototypes, and ensure that
    // a corresponding nodes exists.
    for (let prototype of this.mission.prototypes) {
      let node = this.getNodeFromPrototype(prototype._id)
      if (!node) {
        this.nodes.push(
          this.createNode({
            name: prototype._id.substring(0, 8),
            structureKey: prototype._id,
            color: this.color,
          }),
        )
      }
    }

    // Reposition nodes and draw the lines between them.
    this.positionNodes()
    this.drawRelationshipLines()
  }

  /**
   * This will position all the nodes with mapX and mapY values
   * that correspond with the current state of the mission.
   * @param parent Recursively used. Don't pass anything.
   * @param depth Recursively used. Don't pass anything.
   * @param rowCount Recursively used. Don't pass anything.
   * @param extraLines Recursively used. Don't pass anything.
   * @param rowMostLinesFound Recursively used. Don't pass anything.
   * @returns Subcalls of this recursive function will return results used for
   * further position calculations. The final return can be ignored.
   */
  protected positionNodes = (
    parent: ClientMissionNode = this.root,
    rowCount: Counter = new Counter(0),
    extraLines: Counter = new Counter(0),
    rowMostLinesFound: Counter = new Counter(0),
    buttonData = { foundOnRow: false, rowCount: 0 },
  ): void => {
    let yOffset: number = 0

    // Offset the y position by the number of extra
    // lines found.
    yOffset +=
      extraLines.count *
      ClientMissionNode.LINE_HEIGHT *
      ClientMissionNode.FONT_SIZE
    // Offset the y position by the number of rows
    // with buttons found.
    yOffset += buttonData.rowCount * ClientMissionNode.BUTTONS_HEIGHT

    // If the parent node isn't the rootNode,
    // then this function was recursively
    // called with a reference to a particular
    // node in the mission. This node should be
    // included in the nodeData for the
    //  missionRender so that it displays.
    if (parent._id !== this.root._id) {
      parent.position.set(
        parent.prototype.depth * ClientMissionNode.COLUMN_WIDTH,
        rowCount.count * ClientMissionNode.ROW_HEIGHT + yOffset,
      )
    }

    let children = parent.children

    // Set the most lines found for the row
    // to the row count of this node, unless
    // the previous value is greater.
    rowMostLinesFound.count = Math.max(
      rowMostLinesFound.count,
      parent.nameLineCount,
    )

    // If the parent has buttons, mark buttons as found.
    if (parent.buttons.length > 0) {
      buttonData.foundOnRow = true
    }

    // The childNodes should then be examined
    // by recursively calling this function.
    children.forEach((childNode: ClientMissionNode, index: number) => {
      if (index > 0) {
        // Increment the row count.
        rowCount.increment()

        // Add the number of extra lines found.
        extraLines.count += Math.max(
          0,
          rowMostLinesFound.count - ClientMissionNode.DEFAULT_NAME_LINE_COUNT,
        )

        // Clear the most lines found for the row,
        // so that the next row can start fresh.
        rowMostLinesFound.count = 0

        // If buttons were found on row,
        // increment the row count.
        if (buttonData.foundOnRow) {
          buttonData.rowCount++
        }
        // Then clear found on row, so that the
        // next row can start fresh.
        buttonData.foundOnRow = false
      }

      // Position the child node.
      this.positionNodes(
        childNode,
        rowCount,
        extraLines,
        rowMostLinesFound,
        buttonData,
      )
    })
  }

  /**
   * Draws the relationship lines between nodes on the mission map
   * and caches them in the `relationshipLines` property.
   */
  public drawRelationshipLines(): void {
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
    // relationship lines between nodes.
    const baseAlgorithm = (parent: ClientMissionNode = this.root) => {
      // Get details.
      const { nonRevealedDisplayMode } = this.mission
      let children: ClientMissionNode[] = parent.children
      let firstChild: ClientMissionNode | null = parent.firstChildNode
      let lastChild: ClientMissionNode | null = parent.lastChildNode
      let childCount: number = children.length
      let blurred: boolean = nonRevealedDisplayMode === 'blur' && !parent.opened

      // If the parent is not opened, and the non-revealed
      // display mode is set to hide, then prevent the algorithm
      // from drawing lines any deeper in the structure by returning.
      if (nonRevealedDisplayMode === 'hide' && !parent.opened) return

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
          blurred,
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
        }

        // If there is a last child, calculate
        // the max y value.
        if (lastChild) {
          // Set the max y value to the last child's
          // y position.
          childMaxY = lastChild.position.y
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

          // Push a new line.
          relationshipLines.push({
            key: `down-middle_${parent._id}`,
            direction: 'vertical',
            start: downMidStart,
            length: downMidLength,
            blurred,
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
            blurred,
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

    // Set the relationship lines in the mission to
    // those determined by the algorithm.
    this.relationshipLines = relationshipLines
  }

  /**
   * Calls the callbacks of listeners for the given force event.
   * @param method The event method emitted.
   */
  private emitEvent(method: TForceEventMethod): void {
    // Call any matching listener callbacks
    // or any activity listener callbacks.
    for (let [listenerMethod, listenerCallback] of this.listeners) {
      if (listenerMethod === method || listenerMethod === 'activity') {
        listenerCallback()
      }
    }
  }

  // Implemented
  public addEventListener(
    event: TForceEventMethod,
    callback: () => void,
  ): ClientMissionForce {
    this.listeners.push([event, callback])
    return this
  }

  // Implemented
  public removeEventListener(callback: () => void): ClientMissionForce {
    // Filter out listener.
    this.listeners = this.listeners.filter(([, h]) => h !== callback)
    return this
  }

  // Implemented
  public storeOutput(newOutput: ClientOutput): void {
    let index = this.findInsertionIndex(newOutput)
    this._outputs.splice(index, 0, newOutput)

    // Emit an output event.
    this.emitEvent('output')
  }

  /**
   * Parses the output data into output objects.
   * @param outputs The output data to parse.
   */
  private parseOutputs(outputs: TCommonOutputJson[]): ClientOutput[] {
    return outputs.map((outputJson) => new ClientOutput(this, outputJson))
  }

  /**
   * Filter the outputs based on the conditions of the output and the current user.
   * @returns The filtered outputs.
   */
  protected filterOutputs(): ClientOutput[] {
    return this.outputs
  }
}

/* ------------------------------ CLIENT FORCE TYPES ------------------------------ */

/**
 * Options for creating a ClientMissionForce object.
 */
export type TClientMissionForceOptions = TMissionForceOptions & {}

/**
 * An event that occurs on a force, which can be listened for.
 * @option 'activity'
 * Triggered when any other event occurs.
 * @option 'output'
 * Triggered when an output is sent.
 */
export type TForceEventMethod = 'activity' | 'output'
