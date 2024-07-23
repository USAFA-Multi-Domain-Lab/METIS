import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import ButtonSvg, {
  TButtonSvg,
} from 'src/components/content/user-controls/ButtonSvg'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { useEventListener, useInlineStyling } from 'src/toolbox/hooks'
import { TNodeExecutionState } from '../../../../../../../shared/missions/nodes'
import { TWithKey } from '../../../../../../../shared/toolbox/objects'
import { Vector1D } from '../../../../../../../shared/toolbox/space'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import './MissionNode.scss'

/* -- CONSTANTS -- */

/**
 * The maximum zoom level where the node's content will be displayed.
 */
export const MAX_NODE_CONTENT_ZOOM = 1 / 30 // [numerator]em = [denominator]px

/* -- FUNCTIONS -- */

/**
 * Calculates the initial progress (in milliseconds) for a node.
 * @param node The node in question.
 * @returns The initial progress.
 */
function calculateInitialProgress(node: ClientMissionNode): number {
  // If executing, calculate the initial progress
  // by subtracting the start time from the current
  // time.
  if (node.executing) {
    return Date.now() - node.execution!.start
  }
  // Else, return 0.
  else {
    return 0
  }
}

/* -- COMPONENTS -- */

/**
 * An object representing a node on the mission map.
 */
export default function MissionNode({
  node,
  cameraZoom,
  onSelect,
  applyTooltip = () => node.description,
}: TMissionNode_P): JSX.Element | null {
  /* -- STATE -- */

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
  const [initialProgress, setInitialProgress] = useState<number>(() =>
    calculateInitialProgress(node),
  )
  /**
   * The buttons to display on the node.
   */
  const [buttons, setButtons] = useState<TNodeButton[]>(node.buttons)
  /**
   * Whether the node is blocked.
   */
  const [blocked, setBlocked] = useState<boolean>(node.blocked)

  /* -- EFFECTS -- */

  // Register an event listener to handle activity
  // on the node.
  useEventListener(node, 'activity', () => {
    // Update the state with details stored in
    // the node object.
    setPendingOpen(node.pendingOpen)
    setPendingExecInit(node.pendingExecInit)
    setExecutionState(node.executionState)
    setButtons(node.buttons)
    setInitialProgress(calculateInitialProgress(node))
    setBlocked(node.blocked)
  })

  /* -- COMPUTED -- */

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
    let transition: string | undefined = undefined
    let borderColor: string = node.color

    // If the camera is zoomed out too far,
    // make the background color the node's color.
    if (cameraZoom.x > MAX_NODE_CONTENT_ZOOM) {
      backgroundColor = node.color
    }

    // If there are buttons to display, add height
    // for them.
    if (buttons.length > 0) {
      height += ClientMissionNode.BUTTONS_HEIGHT
    }

    // If the node is blocked, change the border
    // and background color.
    if (blocked) {
      transition =
        'border-color 500ms ease-in-out, background-color 500ms ease-in-out'
      borderColor = '#616060'
      backgroundColor = '#292f36'
    }

    return {
      left: `${x}em`,
      top: `${y}em`,
      width: `${width}em`,
      height: `${height}em`,
      padding: `${verticalPadding}em 0`,
      borderColor: borderColor,
      transition: transition,
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
   * The inline styles for the node's primary content.
   */
  const primaryContentStyle = useInlineStyling((style) => {
    // If there are buttons, change the height
    // of the primary content to account for them.
    if (buttons.length > 0) {
      style.height = `calc(100% - ${ClientMissionNode.BUTTONS_HEIGHT}em)`
    }
  })

  /**
   * The inline styles for the node's name.
   * @memoized
   */
  const nameStyle: React.CSSProperties = compute(() => {
    let width: number = 90
    let fontSize: number = ClientMissionNode.FONT_SIZE
    let lineHeight: number = ClientMissionNode.LINE_HEIGHT

    // If the node is executable, make the
    // width smaller.
    if (node.executable) {
      width = ClientMissionNode.NAME_WIDTH_RATIO * 100
    }

    return {
      width: `${width}%`,
      fontSize: `${fontSize}em`,
      lineHeight: `${lineHeight}em`,
    }
  })

  /**
   * The inline styles for the node's buttons.
   */
  const buttonsStyle = useInlineStyling((style) => {}, {
    height: `${ClientMissionNode.BUTTONS_HEIGHT}em`,
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
    // Add the selected class if the node is selected.
    if (node.selected) {
      classList.push('Selected')
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
    // Add the blocked class if the node is blocked.
    if (blocked) {
      classList.push('Blocked')
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

  /**
   * The class for the node's buttons.
   */
  const buttonsClassName: string = compute(() => {
    let classList = ['Buttons']

    // Hide the buttons if there are none
    // provided.
    if (buttons.length === 0) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  })

  /* -- RENDER -- */

  // Ensure the node selection handler is defined.
  onSelect = onSelect ?? (() => {})

  /**
   * The JSX for the buttons.
   */
  const buttonsJsx: JSX.Element[] = compute(() => {
    return buttons.map((button: TNodeButton): JSX.Element => {
      return (
        <ButtonSvg
          {...button}
          onClick={(event: React.MouseEvent) => {
            button.onClick(event, node)
          }}
          key={button.key}
        />
      )
    })
  })

  /**
   * The JSX for the toopltip.
   */
  const tooltipJsx: JSX.Element | null = compute(() => {
    // If there are no buttons, add a tooltip
    // to the node.
    if (buttons.length === 0) {
      return <Tooltip description={applyTooltip()} />
    }
    // Else, do not add a tooltip, since the tooltips
    // for the buttons will conflict.
    else {
      return null
    }
  })

  // Render root JSX.
  return (
    <div key={node._id} className={rootClassName} style={rootStyle}>
      <div className='ProgressBar' style={progressBarStyle}></div>
      <div
        className='PrimaryContent'
        style={primaryContentStyle}
        onClick={onSelect}
      >
        <div className={nameClassName} style={nameStyle}>
          {node.name}
        </div>
        <div className={iconClassName}></div>
      </div>
      <div className={buttonsClassName} style={buttonsStyle}>
        {buttonsJsx}
      </div>
      {tooltipJsx}
    </div>
  )
}

/**
 * Props for `MissionNode`.
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
  /**
   * Applies a tooltip to the node.
   * @default () => node.description
   */
  applyTooltip?: () => string
}

/**
 * Button SVG type for node-specific buttons.
 */
export type TNodeButton = TWithKey<Omit<TButtonSvg, 'onClick'>> & {
  // Overridden
  /**
   * Handles when the button is clicked.
   * @param event The click event.
   * @param node The node associated with the button.
   */
  onClick: (event: React.MouseEvent, node: ClientMissionNode) => void
}
