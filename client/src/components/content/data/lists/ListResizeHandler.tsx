import { useEffect, useRef, useState } from 'react'
import { useEventListener, useMountHandler } from 'src/toolbox/hooks'

/**
 * Handles resizing of the list by recalculating
 * the number of items available per page.
 */
export default function ListResizeHandler({
  list,
  itemsPerPageState: [itemsPerPage, setItemsPerPage],
  pageNumberState: [pageNumber, setPageNumber],
  itemsPerPageMin = 10,
}: TListResizeHandler_P): JSX.Element | null {
  /* -- STATE -- */

  // Whether the window is currently being resized.
  const [windowIsResizing, setWindowIsResizing] = useState<boolean>(false)
  // Whether an item refresh has been initiated,
  // which will recalculate the items per page.
  const [itemRefreshInitiated, setItemRefreshInitiated] =
    useState<boolean>(false)
  // The last time a window 'resize' event was
  // triggered.
  const lastWindowResizeUpdate = useRef<number>(Date.now())

  /* -- FUNCTIONS -- */

  /**
   * Recomputes the number of page items to display if
   * 'auto' is set for the number of items per page.
   */
  const calculateItemsPerPage = () => {
    let page = list.current!.querySelector('.ListPage')!
    let items = list.current!.querySelector('.ListItems')!
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

  // Initiate initial calculation of items per page
  // on component mount.
  useMountHandler(() => calculateItemsPerPage())

  // On window resize, set windowIsResizing to true.
  useEventListener(window, 'resize', () => {
    // Update the last window resize update.
    lastWindowResizeUpdate.current = Date.now()
    // Set the window to resizing, if it is not already.
    if (!windowIsResizing) setWindowIsResizing(true)
  })

  // On window resize, wait for when the page
  // is no longer resizing.
  useEffect(() => {
    // Add 'Resizing' class to the root element
    // of the list.
    if (windowIsResizing) list.current!.classList.add('Resizing')
    // Else, remove the class.
    else list.current!.classList.remove('Resizing')

    // If the window is resizing, set an interval
    // to check when the last resize update was
    // and initiate a recalculation of the items
    // per page.
    if (windowIsResizing) {
      let interval = setInterval(() => {
        if (Date.now() - lastWindowResizeUpdate.current >= 500) {
          clearInterval(interval)
          setPageNumber(0)
          setItemsPerPage(itemsPerPageMin)
          setWindowIsResizing(false)
          setItemRefreshInitiated(true)
        }
      }, 100)
    }
  }, [windowIsResizing])

  // On item refresh initiation, recalculate the
  // items per page.
  useEffect(() => {
    if (itemRefreshInitiated) {
      calculateItemsPerPage()
      setItemRefreshInitiated(false)
    }
  }, [itemRefreshInitiated])

  // This component is not visible.
  return null
}

/* -- TYPES -- */

/**
 * Props for `ListResizeHandler`.
 */
export type TListResizeHandler_P = {
  /**
   * The ref to the root element of the list.
   */
  list: React.RefObject<HTMLDivElement>
  /**
   * The React state for the items per page.
   */
  itemsPerPageState: TReactState<number>
  /**
   * The React state for the current page number.
   */
  pageNumberState: TReactState<number>
  /**
   * The minimum number of items to display per page.
   * @default 10
   */
  itemsPerPageMin?: number
}
