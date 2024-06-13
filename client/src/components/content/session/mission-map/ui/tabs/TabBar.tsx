import { useEffect, useRef } from 'react'
import ButtonSvg from 'src/components/content/user-controls/ButtonSvg'
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

  /* -- COMPUTED -- */

  /* -- FUNCTIONS -- */

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
        icon={'add'}
        size={'small'}
        onClick={() => {
          onAdd()
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
