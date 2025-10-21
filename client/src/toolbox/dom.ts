/**
 * @param element The element for which a scrollable container
 * should be found.
 * @returns The nearest scrollable ancestor of the element.
 */
export function getScrollableAncestor(
  element: HTMLElement | null,
): Element | null {
  while (element) {
    const style = getComputedStyle(element)
    const overflowY = style.overflowY
    const isScrollable = overflowY === 'auto' || overflowY === 'scroll'
    if (isScrollable) return element
    element = element.parentElement
  }
  return document.scrollingElement || document.documentElement
}
