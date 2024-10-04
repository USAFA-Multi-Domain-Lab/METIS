import { useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import ButtonSvg, {
  TButtonSvg_P,
} from 'src/components/content/user-controls/buttons/ButtonSvg'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import { compute } from 'src/toolbox'
import { useEventListener, useInlineStyling } from 'src/toolbox/hooks'
import { TWithKey } from '../../../../../../../shared/toolbox/objects'
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
}: TMissionPrototype_P): JSX.Element | null {
  /* -- STATE -- */

  /**
   * The buttons to display on the prototype.
   */
  const [buttons, setButtons] = useState<TPrototypeButton[]>(prototype.buttons)

  /* -- HOOKS -- */

  // Register an event listener to handle activity
  // on the prototype.
  useEventListener(prototype, 'activity', () => {
    // Update the state with details stored in
    // the prototype object.
    setButtons(prototype.buttons)
  })

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

    // If there are buttons to display, add height
    // for them.
    if (buttons.length > 0) {
      height += ClientMissionNode.BUTTONS_HEIGHT
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
   * The inline styles for the prototype's primary content.
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

    return {
      width: `${width}%`,
      fontSize: `${fontSize}em`,
      lineHeight: `${lineHeight}em`,
    }
  })

  /**
   * The inline styles for the prototype's buttons.
   */
  const buttonsStyle = useInlineStyling((style) => {}, {
    height: `${ClientMissionNode.BUTTONS_HEIGHT}em`,
  })

  /**
   * The class for the root element.
   */
  const rootClassName: string = compute(() => {
    let classList = ['MissionPrototype']

    // Add the selectable class if the prototype has
    // a selection handler.
    if (onSelect) {
      classList.push('Selectable')
    }
    // Add the selected class if the prototype is
    // selected.
    if (prototype.selected) {
      classList.push('Selected')
    }

    return classList.join(' ')
  })

  /**
   * The class for the prototype's name.
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
   * The class for the prototype's buttons.
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

  /* -- render -- */

  // Ensure the prototype selection handler is defined.
  onSelect = onSelect ?? (() => {})

  /**
   * The JSX for the buttons.
   */
  const buttonsJsx: JSX.Element[] = compute(() => {
    return buttons.map((button: TPrototypeButton): JSX.Element => {
      return (
        <ButtonSvg
          {...button}
          onClick={(event: React.MouseEvent) => {
            button.onClick(event, prototype)
          }}
          key={button.key}
        />
      )
    })
  })

  // Render root JSX.
  return (
    <div
      key={prototype._id}
      className={rootClassName}
      style={rootStyle}
      onClick={onSelect}
    >
      <div className='PrimaryContent' style={primaryContentStyle}>
        <div className={nameClassName} style={nameStyle}>
          {prototype._id.substring(0, 8)}
        </div>
      </div>
      <div className={buttonsClassName} style={buttonsStyle}>
        {buttonsJsx}
      </div>
      <Tooltip description={applyTooltip()} />
    </div>
  )
}

/**
 * Props for `MissionPrototype`.
 */
export type TMissionPrototype_P = {
  /**
   * The prototype to display.
   */
  prototype: ClientMissionPrototype
  /**
   * The current camera zoom.
   */
  cameraZoom: Vector1D
  /**
   * Handler for when the prototype is selected.
   * @default () => {}
   */
  onSelect?: () => void
  /**
   * Applies a tooltip to the prototype.
   * @default () => ''
   */
  applyTooltip?: () => string
}

/**
 * Button SVG type for prototype-specific buttons.
 */
export type TPrototypeButton = TWithKey<Omit<TButtonSvg_P, 'onClick'>> & {
  // Overridden
  /**
   * Handles when the button is clicked.
   * @param event The click event.
   * @param prototype The prototype associated with the button.
   */
  onClick: (event: React.MouseEvent, prototype: ClientMissionPrototype) => void
}
