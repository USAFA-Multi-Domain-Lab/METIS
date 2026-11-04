import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { compute } from '@client/toolbox'
import type { Vector1D } from '@shared/toolbox/numbers/vectors/Vector1D'
import type { Vector2D } from '@shared/toolbox/numbers/vectors/Vector2D'
import './NodeGrid.scss'

/* -- FUNCTIONS -- */

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

/* -- COMPONENT -- */

/**
 * Displays a grid outlining the node columns on the map. It fills the map
 * instead of belonging to the scene, which means the lines have no end to
 * reach, and only its background moves with the camera.
 */
export default function NodeGrid({
  cameraPosition,
  cameraZoom,
  ref,
}: TNodeGrid): TReactElement {
  /* -- computed -- */

  /**
   * The inline styles for the root element. The font size matches the
   * scene's, which is what scales the grid with the camera zoom.
   */
  const rootStyle = compute((): React.CSSProperties => {
    return {
      backgroundSize: `${ClientMissionNode.COLUMN_WIDTH}em 1em`,
      backgroundPositionX: `${calculateNodeGridOffset(cameraPosition)}em`,
      fontSize: `${1 / cameraZoom.x}px`,
    }
  })

  /* -- render -- */

  return <div className='NodeGrid' style={rootStyle} ref={ref}></div>
}

/**
 * Props for `NodeGrid`.
 */
export type TNodeGrid = {
  /**
   * The current camera position.
   */
  cameraPosition: Vector2D
  /**
   * The current camera zoom.
   */
  cameraZoom: Vector1D
  /**
   * The ref for the root element of the grid.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>
}
