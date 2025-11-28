import { compute } from '@client/toolbox/'
import type { Vector1D } from '@shared/toolbox/numbers/vectors/Vector1D'
import { Vector2D } from '@shared/toolbox/numbers/vectors/Vector2D'
import { useState } from 'react'
import './PanController.scss'

/**
 * Controls panning of the `MissionMap` component.
 */
export default function PanController({
  cameraPosition,
  cameraZoom,
  onPan,
}: TPanController): TReactElement | null {
  /* -- STATE -- */

  const [panningIsActive, setPanningIsActive] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * The inline class for the pan controller element.
   */
  const panControllerClassName = compute((): string => {
    let classList = ['PanController']

    // Add the active class if panning is active.
    if (panningIsActive) {
      classList.push('Active')
    } else {
      classList.push('Inactive')
    }

    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */

  /**
   * Handles a mouse move event.
   */
  function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (panningIsActive) {
      // Determine the camera delta from the mouse movement
      // and scale it by the current zoom level.
      let cameraDelta = new Vector2D(
        -event.movementX,
        -event.movementY,
      ).scaleBy(cameraZoom)

      cameraPosition.translateBy(cameraDelta)

      // Call the onPan callback if it exists.
      if (onPan) onPan()
    }
  }

  /* -- RENDER -- */

  // Render root JSX.
  return (
    <div
      className={panControllerClassName}
      onMouseMove={onMouseMove}
      onDragStart={(event) => event.preventDefault()}
      onMouseDown={() => setPanningIsActive(true)}
      onMouseUp={() => setPanningIsActive(false)}
      onMouseLeave={() => setPanningIsActive(false)}
      onContextMenu={(event) => event.preventDefault()}
    ></div>
  )
}

/**
 * Props for `PanController`.
 */
export type TPanController = {
  /**
   * The current camera position.
   */
  cameraPosition: Vector2D
  /**
   * The current camera zoom.
   */
  cameraZoom: Vector1D
  /**
   * Optional callback for when the user pans the map.
   */
  onPan?: () => void
}
