import './PanController.scss'
import { useMemo, useState } from 'react'
import { Vector1D, Vector2D } from '../../../../../../../shared/toolbox/space'

/**
 * Controls panning of the `MissionMap` component.
 */
export default function PanController({
  cameraPosition,
  cameraZoom,
}: TPanController): JSX.Element | null {
  /* -- state -- */

  const [panningIsActive, setPanningIsActive] = useState<boolean>(false)

  /* -- computed -- */

  /**
   * The inline class for the pan controller element.
   */
  const panControllerClassName = useMemo((): string => {
    let classList = ['PanController']

    // Add the active class if panning is active.
    if (panningIsActive) {
      classList.push('Active')
    } else {
      classList.push('Inactive')
    }

    return classList.join(' ')
  }, [panningIsActive])

  /* -- functions -- */

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
    }
  }

  /* -- render -- */

  // Render root JSX.
  return (
    <div
      className={panControllerClassName}
      onMouseMove={onMouseMove}
      onDragStart={({ preventDefault }) => preventDefault()}
      onMouseDown={() => setPanningIsActive(true)}
      onMouseUp={() => setPanningIsActive(false)}
      onMouseLeave={() => setPanningIsActive(false)}
      onContextMenu={({ preventDefault }) => preventDefault()}
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
}
