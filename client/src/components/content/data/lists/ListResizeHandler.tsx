import { useEffect, useRef, useState } from 'react'
import { useResizeObserver } from 'src/toolbox/hooks'
import { useListContext } from './List'
import { TListItem } from './pages/ListItem'

/**
 * Handles resizing of the list by recalculating
 * the number of items available per page.
 */
export default function ListResizeHandler<
  TItem extends TListItem,
>(): JSX.Element | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const { itemsPerPageMin, elements } = listContext
  const [_, setItemsPerPage] = listContext.state.itemsPerPage
  const [___, setPageNumber] = listContext.state.pageNumber
  const [____, setButtonOverflowCount] = listContext.state.buttonOverflowCount
  const [searchActive] = listContext.state.searchActive
  // Whether the list is currently being resized.
  const [isResizing, setIsResizing] = useState<boolean>(true)
  // Whether an refresh has been initiated, which
  // will recalculate size-dependent states.
  const [refreshInitiated, setRefreshInitiated] = useState<boolean>(false)
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
  const calculateButtonOverflow = () => {
    let buttonsElement = elements.buttons.current

    // Determine the overflow count for buttons.
    if (buttonsElement) {
      let buttonElements = Array.from(
        buttonsElement.querySelectorAll('.ButtonSvg'),
      )
      let buttonOverflowCount = 0
      let overflowing = true

      while (overflowing) {
        let buttonElement = buttonElements.pop()
        if (!buttonElement) break

        let buttonsBox = buttonsElement.getBoundingClientRect()
        let buttonBox = buttonElement.getBoundingClientRect()
        let buttonsX2 = buttonsBox.x + buttonsBox.width
        let buttonX2 = buttonBox.x + buttonBox.width

        if (buttonX2 > buttonsX2) buttonOverflowCount++
        else overflowing = false
      }
      setButtonOverflowCount(buttonOverflowCount)
    }
  }

  /* -- EFFECTS -- */

  // Detect when the list resizes and update
  // the state to reflect the change.
  useResizeObserver(
    elements.root,
    () => {
      // Update the last window resize update.
      lastResizeUpdate.current = Date.now()
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
        calculateButtonOverflow()

        // Handle end of resizing by initiating a refresh
        // of the item-per-page count.
        if (Date.now() - lastResizeUpdate.current >= 500) {
          clearInterval(interval)
          setPageNumber(0)
          setItemsPerPage(itemsPerPageMin)
          setIsResizing(false)
          setRefreshInitiated(true)
        }
      }, 100)
    }
  }, [isResizing])

  // On refresh initiation, recalculate the size
  // depend
  useEffect(() => {
    if (refreshInitiated) {
      calculateItemsPerPage()
      setRefreshInitiated(false)
    }
  }, [refreshInitiated])

  useEffect(() => calculateButtonOverflow(), [searchActive])

  // This component is not visible.
  return null
}
