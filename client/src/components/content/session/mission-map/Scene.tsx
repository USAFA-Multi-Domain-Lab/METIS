import { compute } from '@client/toolbox'
import type { Vector1D } from '@shared/toolbox/numbers/vectors/Vector1D'
import type { Vector2D } from '@shared/toolbox/numbers/vectors/Vector2D'
import React from 'react'
import './Scene.scss'

/**
 * A scene/world containing scene objects that can
 * be displayed on the `MissionMap` component. The
 * camera position and zoom are applied to the scene
 * to navigate around the scene.
 */
export default React.forwardRef<HTMLDivElement, TMapScene>(
  ({ cameraPosition, cameraZoom, children }, ref): TReactElement | null => {
    /* -- computed -- */

    /**
     * The inline-CSS for the scene element.
     * @memoized
     */
    const sceneStyle = compute((): React.CSSProperties => {
      return {
        // Scene panning.
        transform: `translate(${-cameraPosition.x}em, ${-cameraPosition.y}em)`,
        // Scene zoom.
        fontSize: `${1 / cameraZoom.x}px`,
      }
    })

    /* -- render -- */

    return (
      <div className='Scene' style={sceneStyle} ref={ref}>
        {/* The objects present in the scene. */}
        {children}
      </div>
    )
  },
)

/**
 * Props for `Scene` component.
 */
export type TMapScene = {
  /**
   * The current camera position.
   */
  cameraPosition: Vector2D
  /**
   * The current camera zoom.
   */
  cameraZoom: Vector1D
  /**
   * The objects in the scene.
   * @default undefined
   */
  children?: React.ReactNode
  /**
   * The ref for the root element of the scene.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>
}
