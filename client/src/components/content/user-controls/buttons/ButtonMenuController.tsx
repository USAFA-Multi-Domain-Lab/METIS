import { useGlobalContext } from 'metis/client/context/global'
import { compute } from 'metis/client/toolbox'
import { useEventListener } from 'metis/client/toolbox/hooks'
import { Vector2D } from 'metis/toolbox'
import { RefObject } from 'react'
import { TButtonMenu_P } from './ButtonMenu'
import ButtonSvgEngine from './panels/engines'

/**
 * Activates a button menu when the target element
 * is right-clicked.
 */
export default function ButtonMenuController({
  target,
  engine,
  highlightTarget,
  trigger = 'r-click',
  listen = true,
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
      // Abort if not listening.
      if (!listen) return

      // Prevent the default context menu.
      event.preventDefault()

      // Show the button menu.
      showButtonMenu(engine, {
        position: new Vector2D(event.clientX, event.clientY),
        highlightTarget,
      })
      onActivate()
    },
    // todo: Using these as dependencies causes the
    // todo: event listener to constantly refresh.
    // todo: This should be fixed.
    [engine, showButtonMenu, listen],
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
   * The engine to power the buttons in the menu.
   */
  engine: ButtonSvgEngine
  /**
   * The target element ref that will activate the button menu
   * when right-clicked.
   */
  target: RefObject<HTMLElement | null>
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
   * Whether the button menu should be actively listening
   * for trigger events. This is useful for temporarily
   * pausing the button menu functionality.
   * @default true
   */
  listen?: boolean
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
