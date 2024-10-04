import { useEffect, useRef, useState } from 'react'
import ButtonSvg from 'src/components/content/user-controls/buttons/ButtonSvg'
import { compute } from 'src/toolbox'
import Tab, { TTab_P } from '.'
import './TabBar.scss'

/**
 * A bar with tabs that can be clicked to change the view.
 */
export default function TabBar({
  tabs,
  index,
  autoSelectNewTabs = true,
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
  const tabSpace = useRef<HTMLDivElement>(null)

  /**
   * Ref for the controls element.
   */
  const controls = useRef<HTMLDivElement>(null)

  /**
   * The previous controlsX1 value.
   */
  const prevControlX1 = useRef<number>(0)

  /**
   * The previous number of tabs.
   */
  const prevTabCount = useRef<number>(tabs.length)

  /* -- EFFECTS -- */

  // Selects new tabs, when they appear.
  useEffect(() => {
    if (!autoSelectNewTabs) return
    // If the number of tabs has increased,
    // select the last tab.
    if (tabs.length > prevTabCount.current) {
      let index = tabs.length - 1
      setIndex(index)
    }
    prevTabCount.current = tabs.length
  }, [tabs.length])

  // Scrolls the tab bar when the
  // controlsX1 changes.
  useEffect(() => {
    let delta = controlsX1 - prevControlX1.current
    if (delta !== 0 && scroll > 1) scrollBy(-delta)
    prevControlX1.current = controlsX1
  })

  // Protects against the scroll going
  // out of bounds.
  useEffect(() => {
    if (scroll < 0) scrollBy(-scroll)
  }, [scroll])

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
   * The left edge of the controls element.
   */
  const controlsX1 = compute(() => {
    // Get controls element, and return 0 if it
    // doesn't exist.
    let controlsElement = controls.current
    if (!controlsElement) return 0
    // Return the controls element's left edge.
    return controlsElement.getBoundingClientRect().left
  })

  /**
   * The left edge of the content within
   * the tab space.
   */
  const contentX1 = compute(() => {
    // Get root element, and return 0 if it
    // doesn't exist.
    let rootElement = root.current
    if (!rootElement) return 0

    // Get the first tab space element.
    const firstTabSpaceElement = rootElement.querySelector('.Tab:first-child')
    if (!firstTabSpaceElement) return 0

    // Return the first tab space element's left edge.
    return firstTabSpaceElement.getBoundingClientRect().left
  })

  /**
   * The right edge of the content within
   * the tab space.
   */
  const contentX2 = compute(() => {
    // Get root element, and return 0 if it
    // doesn't exist.
    let rootElement = root.current
    if (!rootElement) return 0
    // Get the last tab space element.
    const lastTabSpaceElement = rootElement.querySelector('.Tab:last-child')
    if (!lastTabSpaceElement) return 0

    // Return the last tab space element's right edge.
    return lastTabSpaceElement.getBoundingClientRect().right
  })

  /**
   * Gets the next scroll left delta.
   */
  const nextScrollLeftDelta = compute(() => {
    // Get the tab space element.
    let tabSpaceElement = tabSpace.current
    if (!tabSpaceElement) return 0
    // Get the children of the tab space,
    // but reversed.
    let elementsInTabSpace = [...tabSpaceElement.children].reverse()

    // Loop through elements in the tab space
    // and determine the next scroll left delta.
    for (let element of elementsInTabSpace) {
      let rect = element.getBoundingClientRect()
      if (rect.left < rootX1 && Math.abs(rect.left - rootX1) > 1) {
        return rect.left - rootX1
      }
    }
    // Return 0 if no scroll is needed.
    return 0
  })

  /**
   * Gets the next scroll right delta.
   */
  const nextScrollRightDelta = compute(() => {
    // Get the tab space element.
    let tabSpaceElement = tabSpace.current
    if (!tabSpaceElement) return 0
    // Get the children of the tab space element.
    let elementsInTabSpace = [...tabSpaceElement.children]

    // Loop through elements in the tab space
    // and determine the next scroll right delta.
    for (let element of elementsInTabSpace) {
      let rect = element.getBoundingClientRect()
      if (rect.right > controlsX1 && Math.abs(rect.right - controlsX1) > 1) {
        return rect.right - controlsX1
      }
    }
    // Return 0 if no scroll is needed.
    return 0
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
    if (controlsX1 - contentX2 > -1) classList.push('Disabled')

    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */

  /**
   * Scrolls the tab bar by the given amount.
   * @param delta The amount to scroll by.
   */
  const scrollBy = (delta: number) => {
    // Calculate the new scroll amount.
    let newScroll = scroll + delta
    // Get the tab space element.
    let tabSpaceElement = tabSpace.current
    if (!tabSpaceElement) return
    // Apply the scroll amount to the tab space element.
    tabSpaceElement.style.right = `${newScroll}px`
    // Update the scroll state.
    setScroll(newScroll)
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
   * The JSX for the add button.
   */
  const addJsx = compute(() => {
    if (onAdd === null) return null
    return (
      <ButtonSvg
        type={'add'}
        size={'small'}
        onClick={() => {
          onAdd()
        }}
      />
    )
  })

  // Render root JSX.
  return (
    <div className='TabBar' ref={root}>
      <div className='TabSpace' ref={tabSpace}>
        {tabJsx}
        {addJsx}
      </div>
      <div className='Controls' ref={controls}>
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
