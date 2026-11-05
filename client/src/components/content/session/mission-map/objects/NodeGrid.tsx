import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { compute } from '@client/toolbox'
import type { Vector1D } from '@shared/toolbox/numbers/vectors/Vector1D'
import type { Vector2D } from '@shared/toolbox/numbers/vectors/Vector2D'
import { calculateNodeGridOffset } from '../map-math'
import './NodeGrid.scss'

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
