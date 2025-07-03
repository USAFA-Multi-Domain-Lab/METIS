/* -- COMPONENT -- */

import { useRef, useState } from 'react'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useResizeObserver,
  useUnmountHandler,
} from 'src/toolbox/hooks'
import { Vector2D } from '../../../../../../shared/toolbox/space'
import StringToolbox from '../../../../../../shared/toolbox/strings'
import './ButtonMenu.scss'
import ButtonSvgPanel from './v3/ButtonSvgPanel'
import ButtonSvgEngine from './v3/engines'
import { useButtonSvgEngine } from './v3/hooks'
import { TButtonSvgEngine, TButtonSvgPanelOptions } from './v3/types'

/* -- COMPONENT -- */

/**
 * Displays a button context menu when requested
 * at the given position.
 */
export default function ButtonMenu({
  engine,
  position,
  positioningTarget,
  highlightTarget,
  onCloseRequest,
}: TButtonMenu_P): JSX.Element | null {
  /* -- STATE -- */

  const [_, setForcedUpdateId] = useState<string>(
    StringToolbox.generateRandomId(),
  )
  const popUp = useRef<HTMLDivElement>(null)

  /* -- COMPUTED -- */

  /**
   * The position with the offset applied.
   */
  const offsetPosition = compute<Vector2D>(() => {
    const result = position.clone()
    const popUpElm = popUp.current
    const windowSize = new Vector2D(
      window.innerWidth - 10,
      window.innerHeight - 10,
    )

    // If the pop up element is not available,
    // set the position to be off the screen.
    if (!popUpElm) return result.translateY(windowSize.y).scaleX(0)

    const popUpSize = new Vector2D(popUpElm.offsetWidth, popUpElm.offsetHeight)

    // If a target element is provided, then
    // position the button menu relative to
    // the target element.
    if (positioningTarget) {
      // Get the bounding client rect of the target element.
      let rect: DOMRect = positioningTarget.getBoundingClientRect()
      // Set the position of the button menu
      // relative to the target element.
      result.set(rect.right, rect.bottom)
    }

    // Determine the end position of the pop up.
    const popUpEndPosition = new Vector2D(
      result.x + popUpElm.clientWidth,
      result.y + popUpElm.clientHeight,
    )

    // If the pop up is off the right side of the screen,
    // adjust the position.
    if (popUpEndPosition.x > windowSize.x) {
      // Translate the pop up to the left
      // by its own width.
      result.translateX(popUpSize.x * -1)

      // If there is a positional target,
      // adjust the position to the left of
      // the target.
      if (positioningTarget) result.translateX(-positioningTarget.offsetWidth)
    }

    // If the pop up is off the bottom of the screen,
    // adjust the position.
    if (popUpEndPosition.y > windowSize.y) {
      // Translate the pop up upwards
      // by its own height.
      result.translateY(popUpSize.y * -1)

      // If there is a positional target,
      // adjust the position to the top of
      // the target.
      if (positioningTarget) result.translateY(-positioningTarget.offsetHeight)
    }

    return result
  })

  /**
   * The style for the button menu pop up.
   */
  const popUpStyle = {
    left: offsetPosition.x + 'px',
    top: offsetPosition.y + 'px',
  }

  /* -- FUNCTIONS -- */

  /**
   * Forces the component to re-render.
   */
  const forceUpdate = () => setForcedUpdateId(StringToolbox.generateRandomId())

  /* -- EFFECTS -- */

  // Close the menu when the user resizes
  // the window.
  useEventListener(window, ['resize'], onCloseRequest)

  // Close the menu when the user hits
  // a key.
  useEventListener(document, ['keydown'], (event) => {
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

  // Force re-render when the element resizes.
  useResizeObserver(popUp, () => forceUpdate())

  /* -- RENDER -- */

  // Update the button onClick handlers to
  // close the menu when clicked.
  for (let button of engine.buttons) {
    button.onClick = (...args) => {
      button.onClick(...args)
      onCloseRequest()
    }
  }

  // Render the button menu.
  return (
    <div className='ButtonMenu'>
      <div className='InputBlocker' onMouseDown={onCloseRequest}></div>
      <div className='PopUp' style={popUpStyle} ref={popUp}>
        <ButtonSvgPanel engine={engine} />
      </div>
    </div>
  )
}

/* -- HOOKS -- */

/**
 * Creates a new {@link ButtonSvgEngine} for the button menu
 * using the default options needed for a menu.
 * @param elements The svg panel elements to display in the menu.
 * @param layout The layout of the buttons in the menu.
 * @param dependencies The dependencies to use for the engine,
 * creating a new engine if any of them change.
 * @returns The button engine.
 */
export const useButtonMenuEngine = ({
  elements,
  layout,
  dependencies,
}: TButtonMenuEngine_P): ButtonSvgEngine => {
  return useButtonSvgEngine({
    elements,
    options: {
      flow: 'column',
      revealLabels: true,
      layout,
    },
    dependencies,
  })
}

/**
 * Type for the button menu engine props.
 */
export type TButtonMenuEngine_P = Omit<TButtonSvgEngine, 'options'> & {
  /**
   * @see {@link ButtonSvgEngine.layout}
   */
  layout?: TButtonSvgPanelOptions['layout']
}

/* -- TYPES -- */

/**
 * Props for `ButtonMenu`.
 */
export type TButtonMenu_P = {
  /**
   * The engine to power the buttons in the menu.
   */
  engine: ButtonSvgEngine
  /**
   * The position at which to display the button menu.
   */
  position: Vector2D
  /**
   * A target element relative to which the button menu can
   * be positioned.
   * @note This will nullify the `position` property, if
   * provided.
   */
  positioningTarget?: HTMLElement
  /**
   * A target element to highlight, showing the relationship
   * between the element and the button menu.
   * @note Applies 'ButtonMenuHighlight' class to the target element.
   * Styles should be defined in the CSS.
   */
  highlightTarget?: HTMLElement
  /**
   * Callback for when menu needs to be closed.
   */
  onCloseRequest: () => void
}
