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
  const { list, columns, itemsPerPageMin, minNameColumnWidth, getColumnWidth } =
    listContext
  const [_, setItemsPerPage] = listContext.state.itemsPerPage
  const [___, setPageNumber] = listContext.state.pageNumber
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
    let page = list.current!.querySelector('.ListPage')
    let items = list.current!.querySelector('.ListItems')

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

  /* -- EFFECTS -- */

  // Detect when the list resizes and update
  // the state to reflect the change.
  useResizeObserver(
    list,
    () => {
      // Update the last window resize update.
      lastResizeUpdate.current = Date.now()
      // Set the window to resizing, if it is not already.
      if (!isResizing) {
        setIsResizing(true)
      }
    },
    [isResizing],
  )

  // On window resize, wait for when the page
  // is no longer resizing.
  useEffect(() => {
    // Add 'Resizing' class to the root element
    // of the list.
    if (isResizing) list.current!.classList.add('Resizing')
    // Else, remove the class.
    else list.current!.classList.remove('Resizing')

    // If the window is resizing, set an interval
    // to check when the last resize update was
    // and initiate a recalculation of size-dependent
    // states.
    if (isResizing) {
      let interval = setInterval(() => {
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

  // This component is not visible.
  return null
}
