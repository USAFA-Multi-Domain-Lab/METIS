import './PanController.scss'
import { useMemo, useState } from 'react'
import { Vector2D } from '../../../../../../../shared/toolbox/space'

/**
 * Controls panning of the `MissionMap` component.
 */
export default function PanController({
  cameraPosition,
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
      // Translate the camera position by the mouse movement.
      cameraPosition.translate(event.movementX / 64, event.movementY / 64)
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
}

//   /**
//    * A CSS rule that translates an element with the vector.
//    */
//   public get cssTranslation(): string {
//     return `translate(${this._x}em, ${this._y}em)`
//   }
//
//   /**
//    * A CSS rule that scales an element with the vector.
//    */
//   public get cssScale(): string {
//     return `scale(${this._x}, ${this._y})`
//   }
