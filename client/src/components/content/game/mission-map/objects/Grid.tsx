import { useMemo } from 'react'
import './Grid.scss'
import ClientMissionNode from 'src/missions/nodes'

/**
 * A mission map scene object that displays a grid outlining the
 * EM positioning of other objects on the map.
 */
export default function Grid({
  type,
  enabled = true,
}: TGrid): JSX.Element | null {
  /* -- computed -- */

  /**
   * The inline class for the root element.
   */
  const rootClassName = useMemo((): string => {
    let classList = ['Grid']

    // Add the type class.
    switch (type) {
      case 'em':
        classList.push('EmGrid')
        break
      case 'node':
        classList.push('NodeGrid')
        break
    }

    // Hide the node grid if it's disabled.
    if (!enabled) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  }, [enabled])

  /**
   * The inline styles for the root element.
   */
  const rootStyle = useMemo((): React.CSSProperties => {
    // Gather details.
    let backgroundWidth: number = 1

    // If the grid is a node grid, set the background width to the
    // width of a node column.
    if (type === 'node') {
      backgroundWidth = ClientMissionNode.COLUMN_WIDTH
    }

    // Return the styles.
    return {
      backgroundSize: `${backgroundWidth}em 1em`,
    }
  }, [type])

  /* -- render -- */

  return <div className={rootClassName} style={rootStyle}></div>
}

/**
 * Props for `Grid`.
 */
export type TGrid = {
  /**
   * The type of grid to display.
   */
  type: TGridType
  /**
   * Whether the grid is enabled.
   * @default true
   */
  enabled?: boolean
}

/**
 * The type of grid to display.
 */
export type TGridType = 'em' | 'node'
