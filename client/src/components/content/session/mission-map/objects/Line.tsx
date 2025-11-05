import { compute } from 'metis/client/toolbox'
import { Vector2D } from 'metis/toolbox'
import { useMemo } from 'react'
import './Line.scss'

/**
 * A plain line graphic to render on a mission map scene.
 */
export default function Line({
  direction,
  start,
  length,
  blurred = false,
}: TLine_P): TReactElement | null {
  /* -- computed -- */

  /**
   * The start position as a string for memoization.
   * @note React recommends that complex objects not
   * be used as dependencies.
   * @note React recommended assigning `start.toString()`
   * to a variable and using that variable as a dependency
   * instead.
   */
  const startAsString = compute<string>(() => start.toString())

  /**
   * The inline styles for the root element.
   * @memoized
   */
  const rootStyle = useMemo((): React.CSSProperties => {
    // Gather details.
    let lineThickness: number = 0.05 //em
    let halfLineThickness: number = lineThickness / 2 //em
    let minLineThickness: number = 2 //px
    let halfMinLineThickness: number = minLineThickness / 20 //px
    let x: number = start.x
    let y: number = start.y
    let style: React.CSSProperties = {}

    // Calculate the positioning and sizing based
    // on the direction of the line.
    switch (direction) {
      case 'horizontal':
        // Offset y by half the line thickness
        // to center the line.
        y -= halfLineThickness
        // Add sizing styles.
        style.width = `${length}em`
        style.height = `max(${lineThickness}em, ${minLineThickness}px)`
        break
      case 'vertical':
        // Offset x by half the line thickness
        // to center the line.
        x -= halfLineThickness
        // Add sizing styles.
        style.width = `max(${lineThickness}em, ${minLineThickness}px)`
        style.height = `${length}em`
        // Add slight margin and padding to connect
        // any intersecting  horizontal and vertical
        // lines seamlessly.
        style.marginTop = `min(-${halfLineThickness}em, -${halfMinLineThickness}px)`
        style.padding = `max(${halfLineThickness}em, ${halfMinLineThickness}px) 0`
        break
    }

    // Add the positioning styles
    style.left = `${x}em`
    style.top = `${y}em`

    // If the line should be blurred, add the blur style.
    if (blurred) style.filter = 'brightness(0.4)'

    // Return the style.
    return style
  }, [
    // ! Recomputes when:
    // The direction changes.
    direction,
    // The starting position changes.
    startAsString,
    // The length changes.
    length,
    // The blurred state changes.
    blurred,
  ])

  /* -- render -- */

  return <div className='Line' style={rootStyle}></div>
}

/**
 * Props for `Line` component.
 */
export type TLine_P = {
  /**
   * The direction of the line.
   */
  direction: TLineDirection
  /**
   * The start position of the line.
   */
  start: Vector2D
  /**
   * The length of the line.
   */
  length: number
  /**
   * Whether the line should be blurred.
   * @default false
   */
  blurred?: boolean
}

/**
 * The direction of a line.
 * @option 'horizontal' The line only travels horizontally.
 * @option 'vertical' The line only travels vertically.
 */
export type TLineDirection = 'horizontal' | 'vertical'
