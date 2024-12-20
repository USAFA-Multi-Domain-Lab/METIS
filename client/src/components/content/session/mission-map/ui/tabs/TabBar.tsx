import { useEffect, useRef, useState } from 'react'
import ButtonSvg from 'src/components/content/user-controls/buttons/ButtonSvg'
import { compute } from 'src/toolbox'
import Tab, { TTab_P } from '.'
import './TabBar.scss'
import { useForcedUpdates, usePostRenderEffect } from 'src/toolbox/hooks'

/**
 * The offset by which to focus tabs when selected.
 * @note This will bring newly selected tabs closer to the
 * center the higher this value is.
 */
const FOCUS_OFFSET = 50

/**
 * The transition duration for scrolling.
 */
const SCROLL_DURATION = 100

/**
 * A bar with tabs that can be clicked to change the view.
 */
export default function TabBar({
  tabs,
  index,
  autoSelectNewTabs = true,
  addEnabled = true,
  setIndex,
  onAdd = null,
}: TTabBar_P): JSX.Element | null {
  /* -- STATE -- */

  /**
   * The amount of scroll in the tab bar.
   */
  const [scroll, setScroll] = useState<number>(0)

  /**
   * Ref for the root element of the component.
   */
  const root = useRef<HTMLDivElement>(null)

  /**
   * Ref for the tab space component.
   */
  const tabsElm = useRef<HTMLDivElement>(null)

  /**
   * Ref for the controls element.
   */
  const fixedControls = useRef<HTMLDivElement>(null)

  /**
   * The previous tabsX2 value.
   */
  const prevControlsX1 = useRef<number>(0)

  /**
   * The previous tabs.
   */
  const prevTabIds = useRef<string[]>(tabs.map(({ _id }) => _id))

  /* -- HOOKS -- */

  const forceUpdate = useForcedUpdates()

  // Scrolls the tab bar when the
  // controlsX1 changes.
  useEffect(() => {
    let delta = controlsX1 - prevControlsX1.current
    if (delta !== 0 && scroll > 1) scrollBy(-delta, { smooth: false })
    prevControlsX1.current = controlsX1
  })

  // Select new tabs as they appear.
  useEffect(() => {
    if (autoSelectNewTabs && tabs.length > prevTabIds.current.length) {
      // Find the first tab that is not in the previous
      // tabs list and select it.
      for (let i = 0; i < tabs.length; i++) {
        if (!prevTabIds.current.includes(tabs[i]._id)) {
          setIndex(i)
          break
        }
      }
    }
    prevTabIds.current = tabs.map(({ _id }) => _id)
  }, [tabs.length])

  usePostRenderEffect(() => {
    // Get elements.
    let tabsElement = tabsElm.current
    if (!tabsElement) return
    let tabElements = [...tabsElement.children]
    let selectedTab = tabElements[index]
    if (!selectedTab) return

    // Get bounding box for the selected tab.
    let rect = selectedTab.getBoundingClientRect()

    // Offset the scroll to ensure the newly selected
    // tab is centered.
    // scrollBy(rect.left - rootX1 - (tabsWidth - rect.width) / 2)

    if (rect.left < rootX1 + FOCUS_OFFSET) {
      scrollBy(rect.left - rootX1 - FOCUS_OFFSET)
    } else if (rect.right > tabsX2 - FOCUS_OFFSET) {
      scrollBy(rect.right - tabsX2 + FOCUS_OFFSET)
    }
  }, [index])

  /* -- COMPUTED -- */

  /**
   * The left edge of the root element.
   */
  const rootX1 = compute(() => {
    // Get root element, and return 0 if it
    // doesn't exist.
    let rootElement = root.current
    if (!rootElement) return 0
    // Return the root element's left edge.
    return rootElement.getBoundingClientRect().left
  })

  /**
   * The left edge of the tabs element.
   */
  const tabsX1 = compute(() => {
    return rootX1
  })

  /**
   * The right edge of the tabs element.
   */
  const tabsX2 = compute(() => {
    // Get tabs element, and return 0 if it
    // doesn't exist.
    let tabsElement = tabsElm.current
    if (!tabsElement) return 0
    // Return the tabs element's right edge.
    return tabsElement.getBoundingClientRect().right
  })

  /**
   * The width of the tabs element.
   */
  const tabsWidth = compute(() => {
    return tabsX2 - tabsX1
  })

  /**
   * The left edge of the content within
   * the tabs element.
   */
  const contentX1 = compute(() => {
    // Get root element, and return 0 if it
    // doesn't exist.
    let tabsElement = tabsElm.current
    if (!tabsElement) return 0

    // Get the first tab space element.
    const firstTab = tabsElement.querySelector('.Tab:first-child')
    if (!firstTab) return 0

    // Return the first tab space element's left edge.
    return firstTab.getBoundingClientRect().left
  })

  /**
   * The right edge of the content within
   * the tabs element.
   */
  const contentX2 = compute(() => {
    // Get root element, and return 0 if it
    // doesn't exist.
    let tabsElement = tabsElm.current
    if (!tabsElement) return 0

    // Get the last tab space element.
    const lastTab = tabsElement.querySelector('.Tab:last-child')
    if (!lastTab) return 0

    // Return the last tab space element's right edge.
    return lastTab.getBoundingClientRect().right
  })

  /**
   * The width of the content within the tabs element.
   */
  const contentWidth = compute(() => {
    return contentX2 - contentX1
  })

  /**
   * The left edge of the controls element.
   */
  const controlsX1 = compute(() => {
    // Get controls element, and return 0 if it
    // doesn't exist.
    let controlsElement = fixedControls.current
    if (!controlsElement) return 0
    // Return the controls element's left edge.
    return controlsElement.getBoundingClientRect().left
  })

  /**
   * Gets the next scroll left delta.
   */
  const nextScrollLeftDelta = compute(() => {
    // Get the tabs element.
    let tabsElement = tabsElm.current
    if (!tabsElement) return 0
    // Get the tabs in the tabs element.
    let tabElements = [...tabsElement.children].reverse()

    // Loop through elements and determine the
    // next scroll left delta.
    for (let element of tabElements) {
      let rect = element.getBoundingClientRect()
      if (rect.left < rootX1 && Math.abs(rect.left - rootX1) > 1) {
        return Math.min(rect.left - rootX1, 0)
      }
    }
    // Return 0 if no scroll is needed.
    return 0
  })

  /**
   * Gets the next scroll right delta.
   */
  const nextScrollRightDelta = compute(() => {
    let result = 0
    // Get the tabs element.
    let tabsElement = tabsElm.current
    if (!tabsElement) return 0
    // Get the tabs in the tabs element.
    let tabElements = [...tabsElement.children]

    // Loop through elements and determine the next
    // scroll right delta.
    for (let element of tabElements) {
      let rect = element.getBoundingClientRect()
      if (rect.right > tabsX2 && Math.abs(rect.right - tabsX2) > 1) {
        result = Math.max(rect.right - tabsX2, 0)
        break
      }
    }

    // Set a timeout to refresh positional data
    // once the scroll transition is complete.
    setTimeout(() => {
      forceUpdate()
    }, SCROLL_DURATION)

    return result
  })

  /**
   * The maximum scroll amount.
   */
  const maxScroll = compute(() => {
    return Math.max(contentWidth - tabsWidth, 0)
  })

  /**
   * The computed class for the add button.
   */
  const addClass = compute<string>(() => {
    let classList = ['Add', 'Control']

    // If `addEnabled` is false, then add the
    // "Disabled" class.
    if (!addEnabled) classList.push('Disabled')

    return classList.join(' ')
  })

  /**
   * The computed class for the left control.
   */
  const leftClass = compute<string>(() => {
    let classList = ['Left', 'Control']

    // If there is any scroll at all, then
    // scrolling left is a valid option. If
    // there is no scroll, then disable it.
    if (scroll <= 1) classList.push('Disabled')

    return classList.join(' ')
  })

  /**
   * The computed class for the right control.
   */
  const rightClass = compute<string>(() => {
    let classList = ['Right', 'Control']

    // If the end of the tabs is visible, then
    // scrolling right is a valid option. If the
    // end is not visible, then disable it.
    if (tabsX2 - contentX2 > -1) classList.push('Disabled')

    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */

  /**
   * Scrolls the tab bar by the given amount.
   * @param delta The amount to scroll by.
   */
  const scrollBy = (delta: number, options: TTabBarScrollOptions = {}) => {
    // Parse options.
    const { smooth = true } = options
    // Calculate the new scroll amount.
    let newScroll = Math.min(Math.max(scroll + delta, 0), maxScroll)
    // Get the tab space element.
    let tabsElement = tabsElm.current
    if (!tabsElement) return
    // Apply the scroll amount to the tab space element.
    tabsElement.style.marginLeft = `-${newScroll}px`
    tabsElement.style.transition = smooth
      ? `margin-left ${SCROLL_DURATION}ms`
      : ''
    // Update the scroll state.
    setScroll(newScroll)
  }

  /**
   * Handles the add button being clicked.
   */
  const onClickAdd = () => {
    // If there is an add callback, call it.
    if (onAdd) onAdd()
  }

  /**
   * Handles the left control being clicked.
   */
  const onClickLeft = () => {
    // Descrease the scroll amount.
    scrollBy(nextScrollLeftDelta)
  }

  /**
   * Handles the right control being clicked.
   */
  const onClickRight = () => {
    // Increase the scroll amount.
    scrollBy(nextScrollRightDelta)
  }

  /* -- RENDER -- */

  /**
   * The JSX for the tabs.
   */
  const tabJsx = tabs.map((tab, i) => (
    <Tab
      key={tab._id}
      {...tab}
      selected={i === index}
      onClick={() => {
        setIndex(i)
      }}
    />
  ))

  /**
   * JSX for the add button.
   */
  const addJsx = compute<JSX.Element | null>(() => {
    // Return null if no callback for `onAdd`
    // is provided.
    if (!onAdd) return null

    // Else, render the add button.
    return (
      <div className={addClass} onClick={onClickAdd}>
        +
      </div>
    )
  })

  // Render root JSX.
  return (
    <div className='TabBar' ref={root}>
      <div className='TabSpace'>
        <div className='Tabs' ref={tabsElm}>
          {tabJsx}
        </div>
        <div className='Controls FloatingControls'>{addJsx}</div>
      </div>
      <div className='Controls FixedControls' ref={fixedControls}>
        <div className={leftClass} onClick={onClickLeft}>
          &lt;
        </div>
        <div className={rightClass} onClick={onClickRight}>
          &gt;
        </div>
      </div>
    </div>
  )
}

/**
 * Props for `TabBar`.
 */
export type TTabBar_P = {
  /**
   * The tabs to display.
   */
  tabs: TTabBarTab[]
  /**
   * The index of the selected tab.
   */
  index: number
  /**
   * Select new tabs as they appear.
   * @default true
   * @note This can be used in conjunction with `onTabAdd`
   * to automatically select new tabs.
   */
  autoSelectNewTabs?: boolean
  /**
   * Enables the add button, if present.
   * @default true
   * @note A callback for `onAdd` must be provided
   * for the add button to be present.
   */
  addEnabled?: boolean
  /**
   * React setter to set the selected tab.
   */
  setIndex: (index: number) => void
  /**
   * Callback for when a new tab is requested.
   * @default null
   * @note If null, the add button will not even be displayed.
   */
  onAdd?: (() => void) | null
}

/**
 * Tab props to pass to the `Tab` component with
 * certain props omitted.
 */
export type TTabBarTab = Omit<TTab_P, 'selected' | 'onClick'>

/**
 * Options for `scrollBy` function in the
 * `TabBar` component.
 */
export type TTabBarScrollOptions = {
  /**
   * Whether or not to animate the scroll.
   * @default true
   */
  smooth?: boolean
}
