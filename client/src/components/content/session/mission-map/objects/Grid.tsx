import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import './Grid.scss'

/**
 * A mission map scene object that displays a grid outlining the
 * EM positioning of other objects on the map.
 */
export default function Grid({
  type,
  enabled = true,
}: TGrid): TReactElement | null {
  /* -- computed -- */

  /**
   * The inline class for the root element.
   */
  const rootClassName = compute((): string => {
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
  })

  /**
   * The inline styles for the root element.
   */
  const rootStyle = compute((): React.CSSProperties => {
    let backgroundWidth: number = 1

    // If the grid is a node grid, set the background width to the
    // width of a node column.
    if (type === 'node') {
      backgroundWidth = ClientMissionNode.COLUMN_WIDTH
    }

    return {
      backgroundSize: `${backgroundWidth}em 1em`,
    }
  })

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
