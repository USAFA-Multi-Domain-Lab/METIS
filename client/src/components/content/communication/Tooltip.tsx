import { useGlobalContext } from 'metis/client/context/global'
import { useMountHandler } from 'metis/client/toolbox/hooks'
import { useEffect, useRef } from 'react'
import './Tooltip.scss'

/* -- CONSTANTS -- */

export const tooltipsOffsetX = 50 /*px*/
export const tooltipsOffsetY = 35 /*px*/

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
  const [tooltipDescription, setTooltipDescription] =
    globalContext.tooltipDescription

  /* -- COMPONENT REFS -- */

  const rootElement = useRef<HTMLDivElement | null>(null)

  /* -- COMPONENT EFFECTS -- */

  // This will handle the mount of the
  // component.
  useMountHandler((done) => {
    // This will grab the current tooltip root element
    let root_elm: HTMLDivElement | null = rootElement.current
    // This will grab the parent of the root tooltip element
    let parent: HTMLElement | null | undefined = root_elm?.parentElement

    if (root_elm && parent) {
      // This will add the event listeners
      // to the parent element.
      parent.addEventListener('mouseleave', hideTooltip)
      parent.addEventListener('mousemove', confirmTooltipVisibility)
    }

    done()
  })

  // This will handle the unmount of the
  // component.
  useEffect(() => {
    return () => {
      // When the component unmounts, hide
      // the tooltip if it is being displayed.
      hideTooltip()

      // This will grab the current tooltip root element
      let root_elm: HTMLDivElement | null = rootElement.current
      // This will grab the parent of the root tooltip element
      let parent: HTMLElement | null | undefined = root_elm?.parentElement

      // This will remove the event listeners
      // from the parent element.
      if (root_elm && parent) {
        parent.removeEventListener('mouseleave', hideTooltip)
        parent.removeEventListener('mousemove', confirmTooltipVisibility)
      }
    }
  }, [])

  // This will handle the update of the
  // component.
  useEffect(() => {
    // This will grab the current tooltip root element
    let root_elm: HTMLDivElement | null = rootElement.current
    // This will grab the parent of the root tooltip element
    let parent: HTMLElement | null | undefined = root_elm?.parentElement

    if (root_elm && parent) {
      // This will remove the event listeners
      // from the parent element.
      parent.removeEventListener('mouseleave', hideTooltip)
      parent.removeEventListener('mousemove', confirmTooltipVisibility)

      // This will add the event listeners
      // to the parent element.
      parent.addEventListener('mouseleave', hideTooltip)
      parent.addEventListener('mousemove', confirmTooltipVisibility)

      // This will confirm whether the tooltip
      // should be visible or not.
      confirmTooltipVisibility()
    }
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
      // This will set the tooltip element's opacity
      // to 1 so that it is visible.
      tooltip_elm.style.opacity = '1'
      // This will set the tooltip element's transition
      // to the tooltip delay so that it will fade in
      // after the delay.
      tooltip_elm.style.transition = `opacity ${delay}ms`
      // This will set the tooltip description to the
      // description passed to the component.
      setTooltipDescription(description)
    }
  }

  /**
   * This will hide the tooltip.
   */
  const hideTooltip = (): void => {
    // This will grab the current tooltip element that is being displayed.
    let tooltip_elm: HTMLDivElement | null | undefined = tooltips.current

    // If the tooltip element is found, then
    // hide the tooltip.
    if (tooltip_elm) {
      // This will set the tooltip element's opacity
      // to 0 so that it is not visible.
      tooltip_elm.style.opacity = '0'
      // This will set the tooltip element's transition
      // to 0ms so that it will not fade out.
      tooltip_elm.style.transition = 'opacity 0ms'
      // This will set the tooltip description to an
      // empty string.
      setTooltipDescription('')
    }
  }

  /**
   * This will confirm whether the tooltip should be visible or not.
   */
  const confirmTooltipVisibility = (): void => {
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
        hideTooltip()
      }
    }
  }

  /* -- RENDER -- */

  return <div className='Tooltip' ref={rootElement}></div>
}
