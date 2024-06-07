import { useEffect, useRef, useState } from 'react'
import ButtonSvg from 'src/components/content/user-controls/ButtonSvg'
import { compute } from 'src/toolbox'
import Tab, { TTab_P } from '.'
import './TabBar.scss'

/**
 * A bar with tabs that can be clicked to change the view.
 */
export default function TabBar({
  tabs,
  initialIndex = 0,
  autoSelectNewTabs = true,
  onTabSelect = () => {},
  onTabAdd = null,
}: TTabBar_P): JSX.Element | null {
  /* -- STATE -- */

  /**
   * The index of the selected tab.
   */
  const [selectedIndex, selectIndex] = useState<number>(() => {
    // If the initial index is out of bounds, select the first tab.
    if (initialIndex < 0 || initialIndex >= tabs.length) return 0
    return initialIndex
  })

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
      selectIndex(index)
      onTabSelect(tabs[index])
    }
    prevTabCount.current = tabs.length
  }, [tabs.length])

  /* -- COMPUTED -- */

  /* -- FUNCTIONS -- */

  /* -- RENDER -- */

  /**
   * The JSX for the tabs.
   */
  const tabJsx = tabs.map((tab, index) => (
    <Tab
      key={tab._id}
      {...tab}
      selected={index === selectedIndex}
      onClick={() => {
        selectIndex(index)
        onTabSelect(tab)
      }}
    />
  ))

  /**
   * The JSX for the add button.
   */
  const addJsx = compute(() => {
    if (onTabAdd === null) return null
    return (
      <ButtonSvg
        icon={'add'}
        size={'small'}
        onClick={() => {
          onTabAdd()
        }}
      />
    )
  })

  // Render root JSX.
  return (
    <div className='TabBar'>
      {tabJsx}
      {addJsx}
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
   * The index of the initially selected tab.
   * @default 0
   * @note If the index is out of bounds, the first tab will be selected.
   */
  initialIndex?: number
  /**
   * Select new tabs as they appear.
   * @default true
   * @note This can be used in conjunction with `onTabAdd`
   * to automatically select new tabs.
   */
  autoSelectNewTabs?: boolean
  /**
   * Callback for when a tab is selected.
   * @param tab The tab that was selected.
   * @default () => {}
   */
  onTabSelect?: (tab: TTabBarTab) => void
  /**
   * Callback for when a new tab is requested.
   * @default null
   * @note If null, the add button will not even be displayed.
   */
  onTabAdd?: (() => void) | null
}

/**
 * Tab props to pass to the `Tab` component with
 * certain props omitted.
 */
export type TTabBarTab = Omit<TTab_P, 'selected' | 'onClick'>
