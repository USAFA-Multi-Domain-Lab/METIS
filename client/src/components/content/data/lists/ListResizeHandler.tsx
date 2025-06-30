import { useEffect, useRef, useState } from 'react'
import { useCallbackRef, useResizeObserver } from 'src/toolbox/hooks'
import { MetisComponent } from '../../../../../../shared'
import { useListContext } from './List'
import { TListPage_P } from './pages/ListPage'

/**
 * Handles resizing of the list by recalculating
 * the number of items available per page.
 */
export default function ListResizeHandler<
  TItem extends MetisComponent,
>(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const { itemsPerPageMin, elements, pages } = listContext
  const [, setItemsPerPage] = listContext.state.itemsPerPage
  const [, setPageNumber] = listContext.state.pageNumber
  const [, setButtonOverflowCount] = listContext.state.buttonOverflowCount
  const [selection] = listContext.state.selection
  const [searchActive] = listContext.state.searchActive
  // Whether the list is currently being resized.
  const [isResizing, setIsResizing] = useState<boolean>(true)
  // Whether an refresh has been initiated, which
  // will recalculate size-dependent states.
  const [refreshInitiated, setRefreshInitiated] = useState<boolean>(false)
  const [updatePageNumber, setUpdatePageNumber] = useState<boolean>(false)
  // The last time a the list was resized.
  const lastResizeUpdate = useRef<number>(Date.now())
  /* -- FUNCTIONS -- */

  /**
   * Recomputes the number of page items to display
   * per page based on the available space.
   */
  const calculateItemsPerPage = () => {
    let page = elements.root.current!.querySelector('.ListPage')
    let items = elements.root.current!.querySelector('.ListItems')

    // If the elements were not found, return.
    if (!page || !items) return

    let initHeight = page.clientHeight
    let result = items.children.length - 1
    let blanks = []

    for (; page.clientHeight <= initHeight && result < 100; result++) {
      let blank = document.createElement('div')
      blank.className = 'ItemBlank ListItemLike'
      items.appendChild(blank)
      blanks.push(blank)
    }

    // If the items calculated is less than 1,
    // set to one.
    if (result < 1) result = 1

    // Remove the blank items.
    for (let child of blanks) items.removeChild(child)

    setItemsPerPage(result)
  }

  /**
   * Recomputes the number of buttons that are
   * overflowing the available space.
   */
  const calculateButtonOverflow = useCallbackRef(() => {
    if (elements.buttons.current && elements.overflow.current) {
      let buttonsElement = elements.buttons.current
      let overflowElement = elements.overflow.current
      let buttonElements = Array.from(
        buttonsElement.querySelectorAll('.SvgPanelElement:not(.DividerSvg)'),
      )
      let buttonsBox = buttonsElement.getBoundingClientRect()
      let overflowBox = overflowElement.getBoundingClientRect()
      let buttonsX2 = buttonsBox.right
      let overflowX2 = overflowBox.right
      let nextOverflowCount = 0
      let overflowing = true
      let overflowIsVisible =
        getComputedStyle(overflowElement).display !== 'none'

      // Gets the x2 position of the last HTML element
      // in the list nav.
      function getLastX2() {
        let lastElement = buttonElements[buttonElements.length - 1]
        if (!lastElement) return NaN
        let lastBox = lastElement.getBoundingClientRect()
        return lastBox.right
      }

      // If the overflow element is visible, check
      // to see if all buttons would fit in the available
      // space if the overflow element was not displayed.
      if (overflowIsVisible && getLastX2() <= overflowX2) {
        overflowing = false
        nextOverflowCount = 0
      }

      // Determine the number of buttons that are overflowing
      // past the available space.
      while (overflowing) {
        let buttonX2 = getLastX2()
        if (buttonX2 > buttonsX2) nextOverflowCount++
        else overflowing = false
        buttonElements.pop()
      }

      setButtonOverflowCount(nextOverflowCount)
    }
  })

  /* -- EFFECTS -- */

  // Detect when the list resizes and update
  // the state to reflect the change.
  useResizeObserver(
    elements.root,
    (oldClientWidth, oldClientHeight) => {
      // Update the last window resize update.
      lastResizeUpdate.current = Date.now()
      // If the list's height has changed, ensure
      // that the list remains on the same page
      // as before the resize.
      const { clientWidth, clientHeight } = elements.root.current ?? {}
      if (clientWidth !== oldClientWidth && clientHeight !== oldClientHeight) {
        setUpdatePageNumber(true)
      }
      // Set the window to resizing, if it is not already.
      if (!isResizing) setIsResizing(true)
    },
    [isResizing],
  )

  // On window resize, wait for when the page
  // is no longer resizing.
  useEffect(() => {
    // Add 'Resizing' class to the root element
    // of the list.
    if (isResizing) elements.root.current!.classList.add('Resizing')
    // Else, remove the class.
    else elements.root.current!.classList.remove('Resizing')

    // If the window is resizing, set an interval
    // to check when the last resize update was
    // and initiate a recalculation of size-dependent
    // states.
    if (isResizing) {
      let interval = setInterval(() => {
        calculateButtonOverflow.current()

        // Handle end of resizing by initiating a refresh
        // of the item-per-page count.
        if (Date.now() - lastResizeUpdate.current >= 500) {
          clearInterval(interval)

          if (updatePageNumber) {
            let pageNumber = 0
            let selectionPage: TListPage_P<TItem> | undefined = undefined
            if (selection) {
              selectionPage = pages.find(({ items }) =>
                items.includes(selection),
              )
            }
            if (selectionPage) pageNumber = pages.indexOf(selectionPage)
            setPageNumber(pageNumber)
            setUpdatePageNumber(false)
          }

          setItemsPerPage(itemsPerPageMin)
          setIsResizing(false)
          setRefreshInitiated(true)
        }
      }, 100)
    }
  }, [isResizing])

  // On refresh initiation, recalculate the size
  // dependent states.
  useEffect(() => {
    if (refreshInitiated) {
      calculateItemsPerPage()
      setRefreshInitiated(false)
    }
  }, [refreshInitiated])

  useEffect(() => calculateButtonOverflow.current(), [searchActive])

  // This component is not visible.
  return null
}
