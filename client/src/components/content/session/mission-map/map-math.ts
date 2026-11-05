import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type { Vector1D } from '@shared/toolbox/numbers/vectors/Vector1D'
import type { Vector2D } from '@shared/toolbox/numbers/vectors/Vector2D'
import type { TLine_P } from './objects/Line'
import type { TMapCompatibleNode } from './objects/nodes'

/* -- CONSTANTS -- */

/**
 * How far the rendered bounds reach past the view on each side, as a fraction
 * of the view's size. A larger margin updates the bounds less often while
 * panning, but keeps more objects mounted.
 */
const RENDERED_BOUNDS_MARGIN = 0.5

/**
 * How far a node is assumed to reach from its position in any direction, in
 * EM units. Prototypes have no measured size, and this covers every node,
 * including one with a long name and its buttons showing.
 */
const NODE_REACH = ClientMissionNode.COLUMN_WIDTH / 2

/* -- FUNCTIONS -- */

/**
 * @param cameraPosition The position of the camera on the map.
 * @param cameraZoom The zoom level of the camera on the map.
 * @param mapSize The size of the map in pixels.
 * @returns The area of the scene on screen, in EM units.
 */
export function calculateViewBounds(
  cameraPosition: Vector2D,
  cameraZoom: Vector1D,
  mapSize: TMapSize,
): TMapBounds {
  return {
    left: cameraPosition.x,
    top: cameraPosition.y,
    right: cameraPosition.x + mapSize.width * cameraZoom.x,
    bottom: cameraPosition.y + mapSize.height * cameraZoom.x,
  }
}

/**
 * @param cameraPosition The position of the camera on the map.
 * @param cameraZoom The zoom level of the camera on the map.
 * @param mapSize The size of the map in pixels.
 * @returns New rendered bounds around the view, in EM units.
 */
export function calculateRenderedBounds(
  cameraPosition: Vector2D,
  cameraZoom: Vector1D,
  mapSize: TMapSize,
): TMapBounds {
  let view = calculateViewBounds(cameraPosition, cameraZoom, mapSize)
  let marginX = (view.right - view.left) * RENDERED_BOUNDS_MARGIN
  let marginY = (view.bottom - view.top) * RENDERED_BOUNDS_MARGIN

  return {
    left: view.left - marginX,
    top: view.top - marginY,
    right: view.right + marginX,
    bottom: view.bottom + marginY,
  }
}

/**
 * @param outer The bounds that may hold the others.
 * @param inner The bounds that may be held.
 * @returns Whether the inner bounds sit entirely inside the outer bounds.
 */
export function boundsContain(outer: TMapBounds, inner: TMapBounds): boolean {
  return (
    inner.left >= outer.left &&
    inner.top >= outer.top &&
    inner.right <= outer.right &&
    inner.bottom <= outer.bottom
  )
}

/**
 * @param first The first bounds.
 * @param second The second bounds.
 * @returns Whether the bounds share any area, or touch.
 */
export function boundsOverlap(first: TMapBounds, second: TMapBounds): boolean {
  return (
    first.left <= second.right &&
    first.right >= second.left &&
    first.top <= second.bottom &&
    first.bottom >= second.top
  )
}

/**
 * @param node The node in question.
 * @returns The area the node could cover, in EM units.
 */
export function getNodeBounds(node: TMapCompatibleNode): TMapBounds {
  let { x, y } = node.position

  return {
    left: x - NODE_REACH,
    top: y - NODE_REACH,
    right: x + NODE_REACH,
    bottom: y + NODE_REACH,
  }
}

/**
 * @param line The line in question.
 * @returns The area the line covers, in EM units.
 */
export function getLineBounds({
  start,
  direction,
  length,
}: TLine_P): TMapBounds {
  let endX = direction === 'horizontal' ? start.x + length : start.x
  let endY = direction === 'vertical' ? start.y + length : start.y

  return {
    left: Math.min(start.x, endX),
    top: Math.min(start.y, endY),
    right: Math.max(start.x, endX),
    bottom: Math.max(start.y, endY),
  }
}

/**
 * @param mapBounds The bounds of the map element in the DOM.
 * @param clientMouseCoords The clientX and clientY of the window.
 * @param cameraPosition The position of the camera on the map.
 * @param cameraZoom The zoom level of the camera on the map.
 * @returns The coordinates on the map where the cursor currently is, accounts for the camera position and zooming.
 */
export function calcSceneMouseCoords(
  mapBounds: DOMRect,
  clientMouseCoords: Vector2D,
  cameraPosition: Vector2D,
  cameraZoom: Vector1D,
): Vector2D {
  // Calculate the coordinates of the mouse relative to the
  // map bounds, rather than the client window.
  let mapMouseCoords: Vector2D = clientMouseCoords
    .clone()
    .translate(-mapBounds.x, -mapBounds.y)

  // Calculate the coordinates of the mouse relative to the
  // scene, with the camera position and zoom taken into account.
  let sceneMouseCoords: Vector2D = mapMouseCoords
    .clone()
    // Scale the mouse coordinates by the inverse of the camera zoom
    // to convert the mouse coordinates from screen pixel units to scene
    // units.
    .scaleBy(cameraZoom)
    // Translate the mouse coordinates by the camera position to
    // determine the true position of the mouse in the scene.
    .translateBy(cameraPosition)

  // Return the result.
  return sceneMouseCoords
}

/**
 * Calculates where the lines of the grid start, so that they stay on the
 * edges of the node columns however far the camera has moved.
 * @param cameraPosition The position of the camera on the map.
 * @returns The horizontal offset of the grid's background, in EM units. It
 * never reaches the width of a column, since the background repeats.
 */
export function calculateNodeGridOffset(cameraPosition: Vector2D): number {
  let columnWidth: number = ClientMissionNode.COLUMN_WIDTH
  // A node sits at the center of its column, so the column's edge
  // is half a column away from the position of the node.
  let offset: number = (columnWidth / 2 - cameraPosition.x) % columnWidth

  // A remainder keeps the sign of the number being divided.
  return offset < 0 ? offset + columnWidth : offset
}

/**
 * Calculates the height of a node on the map, not counting its vertical
 * padding.
 * @param node The node in question.
 * @returns The height in EM units.
 */
export function calculateNodeHeight(node: TMapCompatibleNode): number {
  let neededHeight: number =
    ClientMissionNode.LINE_HEIGHT *
    ClientMissionNode.FONT_SIZE *
    node.nameLineCount
  let height: number = Math.max(
    ClientMissionNode.DEFAULT_NAME_NEEDED_HEIGHT,
    neededHeight,
  )

  // If there are buttons to display, add height for them.
  if (node.buttons.length > 0) {
    height += ClientMissionNode.BUTTONS_HEIGHT
  }

  return height
}

/* -- TYPES -- */

/**
 * The size of the map in pixels.
 */
export type TMapSize = {
  /**
   * The width of the map in pixels.
   */
  width: number
  /**
   * The height of the map in pixels.
   */
  height: number
}

/**
 * A rectangular area of the scene, in EM units.
 */
export type TMapBounds = {
  /**
   * The position of the left edge.
   */
  left: number
  /**
   * The position of the top edge.
   */
  top: number
  /**
   * The position of the right edge.
   */
  right: number
  /**
   * The position of the bottom edge.
   */
  bottom: number
}
