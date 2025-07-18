import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/v3/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/v3/hooks'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { useEventListener, useInlineStyling } from 'src/toolbox/hooks'
import { TMapCompatibleNode, TMapNode_P, TNodeButton } from '.'
import {
  TNodeBlockStatus,
  TNodeExecutionState,
} from '../../../../../../../../shared/missions/nodes'
import ClassList from '../../../../../../../../shared/toolbox/html/class-lists'
import { useMapContext } from '../../MissionMap'
import './MapNode.scss'

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
function calculateInitialProgress(node: TMapCompatibleNode): number {
  // If executing, calculate the initial progress
  // by subtracting the start time from the current
  // time.
  if (node.executing) {
    return Date.now() - node.latestExecution!.start
  }
  // Else, return 0.
  else {
    return 0
  }
}

/* -- COMPONENT -- */

/**
 * An object representing a node on the mission map.
 */
export default function <TNode extends TMapCompatibleNode>({
  node,
  cameraZoom,
  onSelect,
  applyTooltip = () => '',
}: TMapNode_P<TNode>): JSX.Element | null {
  /* -- STATE -- */

  const localContext = useMapContext()
  const { centerOnMap } = localContext
  const [name, setName] = useState<string>(node.name)
  const [color, setColor] = useState<string>(node.color)
  const [excluded, setExcluded] = useState<boolean>(node.exclude)
  const [icon, setIcon] = useState<TMetisIcon>(node.icon)
  const [executionState, setExecutionState] = useState<TNodeExecutionState>(
    node.executionState,
  )
  const [buttons, setButtons] = useState<TNodeButton<TNode>[]>(node.buttons)
  const [pending, setPending] = useState<boolean>(node.pending)
  /**
   * The initial progress shown on the progress bar,
   * helping account for latency.
   */
  const [initialProgress] = useState<number>(() =>
    calculateInitialProgress(node),
  )
  const [blockStatus, setBlockStatus] = useState<TNodeBlockStatus>(
    node.blockStatus,
  )
  const [blockResolved, setBlockResolved] = useState<boolean>(false)
  const nodeButtonEngine = useButtonSvgEngine({
    elements: buttons,
    dependencies: [buttons],
  })
  const excludeButtonEngine = useButtonSvgEngine({
    elements: [
      {
        type: 'button',
        icon: 'add',
        description: `Include this node ("${node.name}") in the force.`,
        onClick: () => {
          if (node instanceof ClientMissionNode) {
            onSelect!(node)
            node.exclude = false
          }
        },
      },
    ],
    dependencies: [excluded],
  })

  /* -- EFFECTS -- */

  // Update the pending state when the node's
  // pending state changes.
  useEventListener(node, 'set-pending', () => {
    setPending(node.pending)
  })

  // Update the buttons when the node's buttons
  // change.
  useEventListener(node, 'set-buttons', () => {
    setButtons(node.buttons)
  })

  // Update the block status when the node's
  // block status changes.
  useEventListener(node, 'set-blocked', () => {
    let previouslyBlocked = blockStatus === 'blocked'
    let previouslyCutOff = blockStatus === 'cut-off'
    let nowUnblocked = node.blockStatus === 'unblocked'

    setBlockResolved(nowUnblocked && (previouslyBlocked || previouslyCutOff))
    setBlockStatus(node.blockStatus)
  })

  // Update the execution state when the node's
  // execution state changes.
  useEventListener(node, 'exec-state-change', () => {
    setExecutionState(node.executionState)
  })

  // Update the excluded state when the node's
  // excluded state changes.
  useEventListener(node, 'set-exclude', () => {
    setExcluded(node.exclude)
  })

  // Update the color when the node's
  // color changes.
  useEventListener(node, 'set-color', () => setColor(node.color))

  // Update the name when the node's
  // name changes.
  useEventListener(node, 'set-name', () => setName(node.name))

  // Update the icon when the node's
  // icon changes.
  useEventListener(node, 'new-icon', () => setIcon(node.icon))

  // Center the node on the map when an
  // event to do so is emitted.
  useEventListener(node, 'center-on-map', () => {
    centerOnMap(node)
  })

  /* -- COMPUTED -- */

  const { mission } = node
  const blocked: boolean = compute(() => blockStatus === 'blocked')
  const cutOff: boolean = compute(() => blockStatus === 'cut-off')

  /**
   * Determines the context in which the node is being rendered.
   * - `edit`: The node is being rendered on the mission page and can be edited.
   * - `session`: The node is being rendered on the session page and cannot be
   * edited, but it can be interacted with.
   */
  const context = compute(() =>
    mission.nonRevealedDisplayMode === 'show' ? 'edit' : 'session',
  )

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
    let borderColor: string | undefined = color

    // If the camera is zoomed out too far,
    // make the background color the node's color.
    if (cameraZoom.x > MAX_NODE_CONTENT_ZOOM) {
      backgroundColor = color
    }

    // If there are buttons to display, add height
    // for them.
    if (buttons.length > 0) {
      height += ClientMissionNode.BUTTONS_HEIGHT
    }

    return {
      left: `${x}em`,
      top: `${y}em`,
      borderColor,
      width: `${width}em`,
      height: `${height}em`,
      padding: `${verticalPadding}em 0`,
      backgroundColor,
    }
  })

  /**
   * The inline styles for the node's icon.
   */
  const iconStyle: React.CSSProperties = compute(() => {
    if (icon === '_blank') return {}

    return {
      backgroundImage: `url(${require(`../../../../../../assets/images/icons/${icon}.svg`)})`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
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

    // If the node has an icon, reduce
    // the width of the name.
    if (icon !== '_blank') {
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
   * The inline styles for the progress bar.
   */
  const progressBarStyle = useInlineStyling((style) => {
    // If the node is executing, animate
    // the progress bar.
    if (node.executing) {
      let duration = node.latestExecution!.duration

      style.animation = 'loading-animation 750ms linear 0ms infinite'
      style.animation += ', '
      style.animation += `progress-animation ${duration}ms linear -${initialProgress}ms 1 normal forwards`
    }
  })

  /**
   * The class for the root element.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList('MapNode')
      .add(`MapNode_${node._id}`)
      .set('Selectable', !!onSelect)
      .set('Selected', node.selected)
      .set('Pending', pending)
      .set('Blocked', blocked)
      .set('CutOff', cutOff)
      .set('BlockResolved', blockResolved)
      .set(
        'Hidden',
        mission.nonRevealedDisplayMode === 'hide' && !node.revealed,
      )
      .set(
        'Blurred',
        mission.nonRevealedDisplayMode === 'blur' && !node.revealed,
      )
      .set('Excluded', excluded)
      .set('Executing', executionState.status === 'executing')
      .set('Success', executionState.status === 'success')
      .set('Failure', executionState.status === 'failure'),
  )

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
   * The JSX for the toopltip.
   */
  const tooltipJsx: JSX.Element | null = compute(() => {
    // If there are no buttons, add a tooltip
    // to the node.
    if (buttons.length === 0) {
      return (
        <Tooltip
          description={compute<string>(() => {
            if (applyTooltip) return applyTooltip(node)
            else return ''
          })}
        />
      )
    }
    // Else, do not add a tooltip, since the tooltips
    // for the buttons will conflict.
    else {
      return null
    }
  })

  /**
   * The JSX for the reveal node button.
   */
  const revealNodeButton: JSX.Element | null = compute(() => {
    if (context !== 'edit' || !excluded) return null

    return (
      <div className='IncludeButton'>
        <ButtonSvgPanel engine={excludeButtonEngine} />
      </div>
    )
  })

  // Don't render the node on the session page if it's
  // excluded.
  if (context === 'session' && excluded) return null

  // Render root JSX.
  return (
    <div
      key={node._id}
      className={rootClasses.value}
      style={rootStyle}
      onClick={!excluded ? () => onSelect!(node) : () => {}}
    >
      <div className='ProgressBar' style={progressBarStyle}></div>
      <div className='PrimaryContent' style={primaryContentStyle}>
        <div className={nameClassName} style={nameStyle}>
          {name}
        </div>
        <div className={iconClassName} style={iconStyle}></div>
      </div>
      <div className={buttonsClassName} style={buttonsStyle}>
        <ButtonSvgPanel engine={nodeButtonEngine} />
      </div>
      {tooltipJsx}
      {revealNodeButton}
    </div>
  )
}
