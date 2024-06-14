import { TLine_P } from 'src/components/content/session/mission-map/objects/Line'
import ClientMission, { TClientMissionTypes, TMissionNavigable } from '..'
import {
  MissionForce,
  TCommonMissionForceJson,
  TMissionForceOptions,
} from '../../../../shared/missions/forces'
import {
  TMissionNodeJson,
  TMissionNodeOptions,
} from '../../../../shared/missions/nodes'
import { Counter } from '../../../../shared/toolbox/numbers'
import { TWithKey } from '../../../../shared/toolbox/objects'
import { Vector2D } from '../../../../shared/toolbox/space'
import ClientMissionNode from '../nodes'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ClientMissionForce
  extends MissionForce<TClientMissionTypes>
  implements TMissionNavigable
{
  /**
   * The lines used to connect nodes on the mission map.
   */
  public relationshipLines: TWithKey<TLine_P>[]

  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this]
  }

  public constructor(
    mission: ClientMission,
    data: Partial<TCommonMissionForceJson> = MissionForce.DEFAULT_PROPERTIES,
    options: TMissionForceOptions = {},
  ) {
    super(mission, data, options)

    this.relationshipLines = []
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
          this.createNode(
            {
              name: prototype._id.substring(0, 8),
              structureKey: prototype._id,
              color: this.color,
            },
            { openAll: true },
          ),
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
  ): void => {
    let nodeCreationTarget: ClientMissionNode | null = null

    let yOffset: number =
      extraLines.count *
      ClientMissionNode.LINE_HEIGHT *
      ClientMissionNode.FONT_SIZE

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

    // The childNodes should then be examined
    // by recursively calling this function.
    children.forEach((childNode: ClientMissionNode, index: number) => {
      if (index > 0) {
        rowCount.increment()
        extraLines.count += Math.max(
          0,
          rowMostLinesFound.count - ClientMissionNode.DEFAULT_NAME_LINE_COUNT,
        )
        rowMostLinesFound.count = 0
      }

      // Position the child node.
      this.positionNodes(childNode, rowCount, extraLines, rowMostLinesFound)
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
    // relationship lines between nodes. Does not
    // draw the lines between node creators and nodes.
    const baseAlgorithm = (parent: ClientMissionNode = this.root) => {
      // Get details.
      let children: ClientMissionNode[] = parent.children
      let firstChild: ClientMissionNode | null = parent.firstChildNode
      let lastChild: ClientMissionNode | null = parent.lastChildNode
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
}
