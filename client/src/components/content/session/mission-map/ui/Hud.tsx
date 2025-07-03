import './Hud.scss'
import TitleBar from './TitleBar'
import TabBar, { TTabBarTab } from './tabs/TabBar'

/**
 * HUD for the mission map.
 */
export default function Hud({
  tabs = [],
  tabIndex = 0,
  setTabIndex = () => {},
}: THud): JSX.Element | null {
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
