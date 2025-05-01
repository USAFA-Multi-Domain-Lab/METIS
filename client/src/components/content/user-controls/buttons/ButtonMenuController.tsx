import { RefObject } from 'react'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
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
  trigger = 'r-click',
  getDescription,
  onButtonClick,
  onActivate = () => {},
}: TButtonMenuController_P): null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { showButtonMenu } = globalContext.actions

  /* -- COMPUTED -- */

  /**
   * The method to pass to the event listener
   * hook.
   */
  const eventListenerMethod = compute<'click' | 'contextmenu'>(() => {
    switch (trigger) {
      case 'l-click':
        return 'click'
      case 'r-click':
        return 'contextmenu'
      default:
        return 'contextmenu'
    }
  })

  /* -- EFFECTS -- */

  // When the target element is right-clicked,
  // prevent the default context menu and show
  // the button menu.
  useEventListener(
    target.current,
    eventListenerMethod,
    (event: React.MouseEvent<HTMLElement>) => {
      // Prevent the default context menu.
      event.preventDefault()

      // No need to show the button menu if there
      // are no buttons.
      if (!buttons) return

      // Show the button menu.
      showButtonMenu(buttons, onButtonClick, {
        position: new Vector2D(event.clientX, event.clientY),
        highlightTarget,
        getDescription,
      })
      onActivate()
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
   * How the option menu should be triggered.
   * @default 'r-click'
   */
  trigger?: TButtonMenuTrigger
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
  /**
   * A callback for when the button menu is activated.
   */
  onActivate?: () => void
}

/**
 * How the option menu should be triggered.
 * @option 'l-click' The option menu will be triggered
 * when the target element is left-clicked.
 * @option 'r-click' The option menu will be triggered
 * when the target element is right-clicked.
 */
export type TButtonMenuTrigger = 'l-click' | 'r-click'
