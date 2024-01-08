import { useMemo } from 'react'
import { Vector2D } from '../../../../../../../shared/toolbox/space'
import './Line.scss'

export default function Line({
  direction,
  start,
  length,
}: TLine_P): JSX.Element | null {
  /* -- computed -- */

  /**
   * The inline styles for the root element.
   * @memoized
   */
  const rootStyle = useMemo((): React.CSSProperties => {
    // Gather details.
    let lineThickness: number = 0.05
    let x: number = start.x
    let y: number = start.y
    let w: number
    let h: number
    let style: React.CSSProperties = {}

    // Calculate the positioning and sizing based
    // on the direction of the line.
    switch (direction) {
      case 'horizontal':
        // Perform calculations.
        y -= lineThickness / 2
        w = length
        h = lineThickness
        // Add sizing styles.
        style.width = `${w}em`
        style.height = `max(${h}em, 2px)`
        break
      case 'vertical':
        // Perform calculations.
        x -= lineThickness / 2
        w = lineThickness
        h = length
        // Add sizing styles.
        style.width = `max(${w}em, 2px)`
        style.height = `${h}em`
        break
    }

    // Add the positioning styles
    style.left = `${x}em`
    style.top = `${y}em`

    // Return the style.
    return style
  }, [
    // ! Recomputes when:
    // The direction changes.
    direction,
    // The starting position changes.
    start.toString(),
    // The length changes.
    length,
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
}

/**
 * The direction of a line.
 * @option 'horizontal' The line only travels horizontally.
 * @option 'vertical' The line only travels vertically.
 */
export type TLineDirection = 'horizontal' | 'vertical'
