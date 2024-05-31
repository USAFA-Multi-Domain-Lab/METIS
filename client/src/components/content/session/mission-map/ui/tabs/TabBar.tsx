import { useState } from 'react'
import Tab, { TTab_P } from '.'
import './TabBar.scss'

/**
 * A bar with tabs that can be clicked to change the view.
 */
export default function TabBar({
  tabs,
  initialIndex = 0,
  onTabSelect = () => {},
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

  // Render root JSX.
  return <div className='TabBar'>{tabJsx}</div>
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
   * Callback for when a tab is selected.
   * @param tab The tab that was selected.
   * @default () => {}
   */
  onTabSelect?: (tab: TTabBarTab) => void
}

/**
 * Tab props to pass to the `Tab` component with
 * certain props omitted.
 */
export type TTabBarTab = Omit<TTab_P, 'selected' | 'onClick'>
