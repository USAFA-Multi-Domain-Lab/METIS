import './Hud.scss'
import type { TTabBarTab } from './tabs/TabBar'
import TabBar from './tabs/TabBar'
import TitleBar from './TitleBar'

/**
 * HUD for the mission map.
 */
export default function Hud({
  tabs = [],
  tabIndex = 0,
  setTabIndex = () => {},
}: THud): TReactElement | null {
  /* -- RENDER -- */

  // Render root element.
  return (
    <div className='Hud'>
      <TitleBar />
      <TabBar tabs={tabs} index={tabIndex} setIndex={setTabIndex} />
    </div>
  )
}

/**
 * Props for `Hud` component.
 */
export type THud = {
  /**
   * The tabs to display on the tab bar.
   * @default []
   */
  tabs?: TTabBarTab[]
  /**
   * The index of the selected tab.
   * @default 0
   */
  tabIndex?: number
  /**
   * React setter for the selected tab index.
   * @default () => {}
   */
  setTabIndex?: (index: number) => void
}
