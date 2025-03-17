import { RefObject } from 'react'
import { useGlobalContext } from 'src/context'
import { useEventListener } from 'src/toolbox/hooks'
import { Vector2D } from '../../../../../../shared/toolbox/space'
import { TButtonMenu_P } from './ButtonMenu'

/**
 * Activates a button menu when the target element
 * is right-clicked.
 */
export default function ButtonMenuController({
  target,
  buttons,
  highlightTarget,
  getDescription,
  onButtonClick,
}: TButtonMenuController_P): null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { showButtonMenu } = globalContext.actions

  /* -- EFFECTS -- */

  // When the target element is right-clicked,
  // prevent the default context menu and show
  // the button menu.
  useEventListener(
    target.current,
    'contextmenu',
    (event: React.MouseEvent<HTMLElement>) => {
      // Prevent the default context menu.
      event.preventDefault()

      // Show the button menu.
      showButtonMenu(buttons, onButtonClick, {
        position: new Vector2D(event.clientX, event.clientY),
        highlightTarget,
        getDescription,
      })
    },
    // todo: Using these as dependencies causes the
    // todo: event listener to constantly refresh.
    // todo: This should be fixed.
    [showButtonMenu, getDescription, onButtonClick],
  )

  /* -- RENDER -- */

  // Render nothing.
  return null
}

/* -- TYPES -- */

/**
 * Props for `ButtonMenuController`.
 */
export type TButtonMenuController_P = {
  /**
   * The target element ref that will activate the button menu
   * when right-clicked.
   */
  target: RefObject<HTMLElement>
  /**
   * The buttons to display in the button menu.
   */
  buttons: TButtonMenu_P['buttons']
  /**
   * The target element to highlight when the button menu is
   * shown.
   */
  highlightTarget?: TButtonMenu_P['highlightTarget']
  /**
   * Gets the description for a button.
   * @param button The button for which to get the description.
   * @returns The description for the button, if null, the type
   * will be used in its plain text form.
   * @note If this function is not provided, the type will be
   * used in its plain text form.
   */
  getDescription?: TButtonMenu_P['getDescription']
  /**
   * A callback for when a button in the button menu is clicked.
   * @param button The button that was clicked.
   */
  onButtonClick: TButtonMenu_P['onButtonClick']
}
