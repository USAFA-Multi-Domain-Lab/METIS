import { useEffect, useMemo } from 'react'
import ClientMissionNode from 'src/missions/nodes'
import './MissionNode.scss'
import { Vector1D } from '../../../../../../../shared/toolbox/space'

/* -- constants -- */

/**
 * The maximum zoom level where the node's content will be displayed.
 */
export const MAX_NODE_CONTENT_ZOOM = 1 / 30 // [numerator]em = [denominator]px

/* -- components -- */

/**
 * An object representing a node on the mission map.
 */
export default function MissionNode({
  node,
  cameraZoom,
  onSelect,
}: TMissionNode_P): JSX.Element | null {
  /* -- effects -- */

  /* -- computed -- */

  /**
   * The inline styles for the root element.
   * @memoized
   */
  const rootStyle = ((): React.CSSProperties => {
    let neededHeight: number =
      ClientMissionNode.LINE_HEIGHT *
      ClientMissionNode.FONT_SIZE *
      node.nameLineCount
    let x: number = node.position.x
    let y: number = node.position.y
    let width: number = ClientMissionNode.WIDTH
    let height: number = Math.max(
      ClientMissionNode.DEFAULT_NAME_NEEDED_HEIGHT,
      neededHeight,
    )
    let verticalPadding: number = ClientMissionNode.VERTICAL_PADDING
    // Undefined will default to the background
    // color defined already in the CSS.
    let backgroundColor: string | undefined = undefined

    // If the camera is zoomed out too far,
    // make the background color the node's color.
    if (cameraZoom.x > MAX_NODE_CONTENT_ZOOM) {
      backgroundColor = node.color
    }

    return {
      left: `${x}em`,
      top: `${y}em`,
      width: `${width}em`,
      height: `${height}em`,
      padding: `${verticalPadding}em 0`,
      borderColor: node.color,
      backgroundColor,
    }
  })()

  /**
   * The inline styles for the node's name.
   * @memoized
   */
  const nameStyle = ((): React.CSSProperties => {
    let width: number = ClientMissionNode.NAME_WIDTH_RATIO * 100
    let fontSize: number = ClientMissionNode.FONT_SIZE
    let lineHeight: number = ClientMissionNode.LINE_HEIGHT

    return {
      width: `${width}%`,
      fontSize: `${fontSize}em`,
      lineHeight: `${lineHeight}em`,
    }
  })()

  /**
   * The class for the root element.
   */
  const rootClassName = ((): string => {
    let classList = ['MissionNode']

    // Add the selectable class if the node has
    // a selection handler.
    if (onSelect) {
      classList.push('Selectable')
    }
    // Add the executable class if the node is
    // executable.
    if (node.executable) {
      classList.push('Executable')
    }
    // Add the device class if the node is a
    // device.
    if (node.device) {
      classList.push('Device')
    }

    return classList.join(' ')
  })()

  /**
   * The class for the node's name.
   */
  const nameClassName = ((): string => {
    let classList = ['Name', 'Text']

    // Add the hidden class if the camera is
    // zoomed out too far.
    if (cameraZoom.x > MAX_NODE_CONTENT_ZOOM) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  })()

  /**
   * The class for the node's icon.
   */
  const iconClassName = ((): string => {
    let classList = ['Icon']

    // Add the hidden class if the camera is
    // zoomed out too far.
    if (cameraZoom.x > MAX_NODE_CONTENT_ZOOM) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  })()

  /* -- render -- */

  // Ensure the node selection handler is defined.
  onSelect = onSelect ?? (() => {})

  // Render root JSX.
  return (
    <div
      key={node.nodeID}
      className={rootClassName}
      style={rootStyle}
      onClick={onSelect}
    >
      <div className={nameClassName} style={nameStyle}>
        {node.name}
      </div>
      <div className={iconClassName}></div>
    </div>
  )
}

/**
 * Props for `Node`.
 */
export type TMissionNode_P = {
  /**
   * The node to display.
   */
  node: ClientMissionNode
  /**
   * The current camera zoom.
   */
  cameraZoom: Vector1D
  /**
   * Handler for when the node is selected.
   * @default () => {}
   */
  onSelect?: () => void
}
