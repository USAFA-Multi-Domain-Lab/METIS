import ClientMissionNode from 'src/missions/nodes'
import './MissionNode.scss'
import { Vector1D } from '../../../../../../../shared/toolbox/space'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { compute } from 'src/toolbox'
import { useState } from 'react'
import { TNodeExecutionState } from '../../../../../../../shared/missions/nodes'
import { useEventListener, useInlineStyling } from 'src/toolbox/hooks'

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
  /* -- state -- */

  /**
   * The execution state of the node.
   */
  const [executionState, setExecutionState] = useState<TNodeExecutionState>(
    node.executionState,
  )
  /**
   * Whether the node is pending to be opened.
   */
  const [pendingOpen, setPendingOpen] = useState<boolean>(node.pendingOpen)
  /**
   * Whether the node is pending execution initiation.
   */
  const [pendingExecInit, setPendingExecInit] = useState<boolean>(
    node.pendingExecInit,
  )
  /**
   * The initial progress shown on the progress bar,
   * helping account for latency.
   */
  const [initialProgress, setInitialProgress] = useState<number>(0)

  /* -- effects -- */

  // Register an event listener to handle activity
  // on the node.
  useEventListener(node, 'activity', () => {
    // Update the state with details stored in
    // the node object.
    setPendingOpen(node.pendingOpen)
    setPendingExecInit(node.pendingExecInit)
    setExecutionState(node.executionState)

    // If node is executing, update the initial
    // progress.
    if (node.executing) {
      setInitialProgress(Date.now() - node.execution!.start)
    }
  })

  /* -- computed -- */

  /**
   * The inline styles for the root element.
   * @memoized
   */
  const rootStyle: React.CSSProperties = compute(() => {
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
  })

  /**
   * The inline styles for the progress bar.
   */
  const progressBarStyle = useInlineStyling((style) => {
    // If the node is executing, animate
    // the progress bar.
    if (node.executing) {
      let duration = node.execution!.duration

      style.animation = 'loading-animation 750ms linear 0ms infinite'
      style.animation += ', '
      style.animation += `progress-animation ${duration}ms linear -${initialProgress}ms 1 normal forwards`
    }
  })

  /**
   * The inline styles for the node's name.
   * @memoized
   */
  const nameStyle: React.CSSProperties = compute(() => {
    let width: number = ClientMissionNode.NAME_WIDTH_RATIO * 100
    let fontSize: number = ClientMissionNode.FONT_SIZE
    let lineHeight: number = ClientMissionNode.LINE_HEIGHT

    return {
      width: `${width}%`,
      fontSize: `${fontSize}em`,
      lineHeight: `${lineHeight}em`,
    }
  })

  /**
   * The class for the root element.
   */
  const rootClassName: string = compute(() => {
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
    // Add pending open class if the node is
    // pending to be opened.
    if (pendingOpen) {
      classList.push('PendingOpen')
    }
    // Add pending execution initiation class if the node
    // is pending execution initiation.
    if (pendingExecInit) {
      classList.push('PendingExecInit')
    }
    // Add the execution state class.
    classList.push(StringToolbox.capitalize(executionState))

    return classList.join(' ')
  })

  /**
   * The class for the node's name.
   */
  const nameClassName: string = compute(() => {
    let classList = ['Name', 'Text']

    // Add the hidden class if the camera is
    // zoomed out too far.
    if (cameraZoom.x > MAX_NODE_CONTENT_ZOOM) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  })

  /**
   * The class for the node's icon.
   */
  const iconClassName: string = compute((): string => {
    let classList = ['Icon']

    // Add the hidden class if the camera is
    // zoomed out too far.
    if (cameraZoom.x > MAX_NODE_CONTENT_ZOOM) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  })

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
      <div className='ProgressBar' style={progressBarStyle}></div>
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
