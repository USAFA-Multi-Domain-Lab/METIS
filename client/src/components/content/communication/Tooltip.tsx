import { useGlobalContext } from '@client/context/global'
import { useEffect, useRef } from 'react'
import './Tooltip.scss'

/* -- CONSTANTS -- */

export const tooltipsOffsetX = 50 /*px*/
export const tooltipsOffsetY = 35 /*px*/

/**
 * The description most recently handed to the tooltip. This can be ahead of
 * the global state while that update waits for a render, so checks against it
 * are never fooled by a value that is out of date. Every tooltip component
 * shares the one tooltip element, so they share this as well.
 */
let requestedDescription: string = ''

/**
 * This is a tooltip component that can be rendered in the child of an element so that when that element
 * is hovered over, a tooltip is displayed with a given description.
 * @param props.description The description to display in the tooltip.
 * @returns {TReactElement} The tooltip component.
 */
export default function Tooltip({
  description,
  delay = 333,
}: {
  description: string
  delay?: number
}): TReactElement {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [tooltips] = globalContext.tooltips
  const [_, setTooltipDescription] = globalContext.tooltipDescription

  /* -- COMPONENT REFS -- */

  const rootElement = useRef<HTMLDivElement | null>(null)

  /* -- COMPONENT EFFECTS -- */

  // This will add the event listeners to the
  // parent element when the component mounts,
  // and remove them when it unmounts. The
  // listeners call through refs, so they always
  // use the latest props.
  useEffect(() => {
    // This will grab the parent of the root tooltip element
    let parent: HTMLElement | null | undefined =
      rootElement.current?.parentElement
    let onMouseLeave = () => hideTooltip.current()
    let onMouseMove = () => confirmTooltipVisibility.current()

    parent?.addEventListener('mouseleave', onMouseLeave)
    parent?.addEventListener('mousemove', onMouseMove)

    return () => {
      // When the component unmounts, hide
      // the tooltip if it is being displayed.
      hideTooltip.current()

      parent?.removeEventListener('mouseleave', onMouseLeave)
      parent?.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  // This will confirm whether the tooltip
  // should be visible or not when the
  // description changes.
  useEffect(() => {
    confirmTooltipVisibility.current()
  }, [description])

  /* -- COMPONENT FUNCTIONS -- */

  /**
   * This will show the tooltip with the given description.
   */
  const showTooltip = (): void => {
    // This will grab the current tooltip element that is being displayed.
    let tooltip_elm: HTMLDivElement | null | undefined = tooltips.current

    // If the tooltip element is found, then
    // show the tooltip.
    if (tooltip_elm) {
      // This will set the tooltip element's transition
      // to the tooltip delay so that it will fade in
      // after the delay.
      tooltip_elm.style.transition = `opacity ${delay}ms`
      // If the tooltip already holds this description's
      // text, it can be shown right away. Otherwise, the
      // app shows it once the text is in place, so it
      // never appears as an empty bubble.
      if (tooltip_elm.dataset.displayedDescription === description) {
        tooltip_elm.style.opacity = '1'
      }
      // This will hand the description to the tooltip
      // only when it changes. This runs on every mouse
      // movement, and each hand-off re-renders the app.
      if (requestedDescription !== description) {
        requestedDescription = description
        setTooltipDescription(description)
      }
    }
  }

  /**
   * This will hide the tooltip.
   */
  const hideTooltip = useRef(() => {})
  hideTooltip.current = () => {
    // This will grab the current tooltip element that is being displayed.
    let tooltip_elm: HTMLDivElement | null | undefined = tooltips.current

    // If the tooltip element is found and
    // a description has been handed to it, then
    // hide the tooltip.
    if (tooltip_elm && requestedDescription) {
      // This will set the tooltip element's opacity
      // to 0 so that it is not visible.
      tooltip_elm.style.opacity = '0'
      // This will set the tooltip element's transition
      // to 0ms so that it will not fade out.
      tooltip_elm.style.transition = 'opacity 0ms'
      // This will set the tooltip description to an
      // empty string.
      requestedDescription = ''
      setTooltipDescription('')
    }
  }

  /**
   * This will confirm whether the tooltip should be visible or not.
   */
  const confirmTooltipVisibility = useRef(() => {})
  confirmTooltipVisibility.current = () => {
    // This will grab the current tooltip root element
    let root_elm: HTMLDivElement | null = rootElement.current
    // This will grab the parent of the root tooltip element
    let parent: HTMLElement | null | undefined = root_elm?.parentElement
    // This is a list of empty strings which are not valid.
    let emptyStrings: string[] = ['']

    if (parent) {
      // Checks to see if the parent of the root tooltip element
      // is being hovered over.
      let parentIsHoveredOver: boolean = parent.matches(':hover')

      // If the parent is being hovered over, and the
      // description is not empty, show the tooltip.
      if (parentIsHoveredOver && !emptyStrings.includes(description)) {
        showTooltip()
      }
      // If the parent is not being hovered over, then
      // hide the tooltip.
      else if (!parentIsHoveredOver) {
        hideTooltip.current()
      }
    }
  }

  /* -- RENDER -- */

  return <div className='Tooltip' ref={rootElement}></div>
}
