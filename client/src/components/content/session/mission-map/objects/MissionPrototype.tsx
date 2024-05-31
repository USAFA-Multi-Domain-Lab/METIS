import Tooltip from 'src/components/content/communication/Tooltip'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import { compute } from 'src/toolbox'
import { Vector1D } from '../../../../../../../shared/toolbox/space'
import { MAX_NODE_CONTENT_ZOOM } from './MissionNode'
import './MissionPrototype.scss'

/* -- constants -- */

/**
 * The maximum zoom level where the prototype's content will be displayed.
 */
export const MAX_PROTOTYPE_CONTENT_ZOOM = MAX_NODE_CONTENT_ZOOM
/**
 * The color of prototypes on the map.
 */
export const PROTOTYPE_COLOR = '#ffffff'

/* -- components -- */

/**
 * An object representing a prototype on the mission map.
 */
export default function MissionPrototype({
  prototype,
  cameraZoom,
  onSelect,
  applyTooltip = () => '',
}: TMissionNode_P): JSX.Element | null {
  /* -- STATE -- */

  /* -- HOOKS -- */

  // Register an event listener to handle activity
  // on the node.
  // useEventListener(node, 'activity', () => {
  // })

  /* -- computed -- */

  /**
   * The inline styles for the root element.
   * @memoized
   */
  const rootStyle: React.CSSProperties = compute(() => {
    let neededHeight: number =
      ClientMissionNode.LINE_HEIGHT * ClientMissionNode.FONT_SIZE
    let x: number = prototype.position.x
    let y: number = prototype.position.y
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
      backgroundColor = PROTOTYPE_COLOR
    }

    return {
      left: `${x}em`,
      top: `${y}em`,
      width: `${width}em`,
      height: `${height}em`,
      padding: `${verticalPadding}em 0`,
      borderColor: PROTOTYPE_COLOR,
      backgroundColor,
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
    let classList = ['MissionPrototype']

    // Add the selectable class if the node has
    // a selection handler.
    if (onSelect) {
      classList.push('Selectable')
    }

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

  /* -- render -- */

  // Ensure the node selection handler is defined.
  onSelect = onSelect ?? (() => {})

  // Render root JSX.
  return (
    <div
      key={prototype._id}
      className={rootClassName}
      style={rootStyle}
      onClick={onSelect}
    >
      <div className='PrimaryContent'>
        <div className={nameClassName} style={nameStyle}>
          {prototype._id.substring(0, 8)}
        </div>
      </div>
      <Tooltip description={applyTooltip()} />
    </div>
  )
}

/**
 * Props for `MissionPrototype`.
 */
export type TMissionNode_P = {
  /**
   * The prototype to display.
   */
  prototype: ClientMissionPrototype
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
