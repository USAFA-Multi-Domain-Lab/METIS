/* -- COMPONENT -- */

import {
  useEventListener,
  useMountHandler,
  useUnmountHandler,
} from 'src/toolbox/hooks'
import { Vector2D } from '../../../../../../shared/toolbox/space'
import './ButtonMenu.scss'
import ButtonSvg, { TButtonSvgType } from './ButtonSvg'

/* -- COMPONENT -- */

/**
 * Displays a button context menu when requested
 * at the given position.
 */
export default function ButtonMenu({
  buttons,
  position,
  highlightTarget,
  getDescription,
  onButtonClick,
  onCloseRequest,
}: TButtonMenu_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The style for the button menu pop up.
   */
  const popUpStyle = {
    left: position.x + 'px',
    top: position.y + 'px',
  }

  /* -- EFFECTS -- */

  // Close the menu when the user hits
  // a key.
  useEventListener(document, 'keydown', (event) => {
    event.preventDefault()
    onCloseRequest()
  })

  // Add highlight to target when menu is shown.
  useMountHandler((done) => {
    if (highlightTarget) highlightTarget.classList.add('ButtonMenuHighlight')
    done()
  })

  // Remove highlight from target when menu is removed.
  useUnmountHandler(() => {
    if (highlightTarget) highlightTarget.classList.remove('ButtonMenuHighlight')
  })

  /* -- RENDER -- */

  /**
   * The JSX for the buttons.
   */
  const buttonsJsx = buttons.map((button) => {
    // Initialize the description, as the
    // button type.
    let description: string = button

    // Get the description, if a function is provided,
    // leaving the description as the button type, if
    // the function returns null.
    if (getDescription) description = getDescription(button) ?? button

    return (
      <ButtonSvg
        key={button}
        type={button}
        size='wide'
        description={description}
        onClick={() => onButtonClick(button)}
      />
    )
  })

  // Render the button menu.
  return (
    <div className='ButtonMenu'>
      <div className='InputBlocker' onMouseDown={onCloseRequest}></div>
      <div className='PopUp' style={popUpStyle}>
        {buttonsJsx}
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for `ButtonMenu`.
 */
export type TButtonMenu_P = {
  /**
   * The buttons to display in the button menu.
   */
  buttons: TButtonSvgType[]
  /**
   * The position at which to display the button menu.
   */
  position: Vector2D
  /**
   * A target element to highlight, showing the relationship
   * between the element and the button menu.
   * @note Applies 'ButtonMenuHighlight' class to the target element.
   * Styles should be defined in the CSS.
   */
  highlightTarget?: HTMLElement
  /**
   * Gets the description for a button.
   * @param button The button for which to get the description.
   * @returns The description for the button, if null, the type
   * will be used in its plain text form.
   * @note If this function is not provided, the type will be
   * used in its plain text form.
   */
  getDescription?: (button: TButtonSvgType) => string | null
  /**
   * The function to call when a button is clicked.
   */
  onButtonClick: (button: TButtonSvgType) => void
  /**
   * Callback for when menu needs to be closed.
   */
  onCloseRequest: () => void
}
