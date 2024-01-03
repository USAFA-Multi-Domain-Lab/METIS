import { useMemo } from 'react'
import { Vector1D, Vector2D } from '../../../../../../shared/toolbox/space'
import './Scene.scss'

export default function ({
  cameraPosition,
  cameraZoom,
  children,
}: TMapScene): JSX.Element | null {
  /* -- computed -- */

  /**
   * The inline-CSS for the scene element.
   * @memoized
   */
  const sceneStyle = useMemo((): React.CSSProperties => {
    return {
      // Scene panning.
      transform: `translate(${-cameraPosition.x}em, ${-cameraPosition.y}em)`,
      // Scene zoom.
      fontSize: `${1 / cameraZoom.x}px`,
    }
  }, [cameraPosition.toString(), cameraZoom.toString()])

  /* -- render -- */

  return (
    <div className='Scene' style={sceneStyle}>
      {/* The objects present in the scene. */}
      {children}
    </div>
  )
}

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
   */
  children: React.ReactNode
}
