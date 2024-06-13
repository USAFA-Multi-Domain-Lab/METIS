import { TButtonSvg } from 'src/components/content/user-controls/ButtonSvg'
import ClientMission from 'src/missions'
import { TWithKey } from '../../../../../../../shared/toolbox/objects'
import './Hud.scss'
import TitleBar from './TitleBar'
import TabBar, { TTabBarTab } from './tabs/TabBar'

/**
 * The master tab for the tab bar.
 */
const MASTER_TAB: TTabBarTab = {
  _id: 'master',
  text: 'Master',
  color: '#ffffff',
}

/**
 * HUD for the mission map.
 */
export default function Hud({
  mission,
  buttons = [],
  tabs = [],
  tabIndex = 0,
  setTabIndex = () => {},
  onTabAdd = null,
}: THud): JSX.Element | null {
  /* -- RENDER -- */

  // Render root element.
  return (
    <div className='Hud'>
      <TitleBar title={mission.name} buttons={buttons} />
      <TabBar
        tabs={tabs}
        index={tabIndex}
        setIndex={setTabIndex}
        onAdd={onTabAdd}
      />
    </div>
  )
}

/**
 * Props for `Hud` component.
 */
export type THud = {
  /**
   * The mission to display.
   */
  mission: ClientMission
  /**
   * The buttons to display on the title bar.
   * @default []
   */
  buttons?: TWithKey<TButtonSvg>[]
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
  /**
   * Callback for when a new tab is requested.
   * @default null
   * @note If null, the add button will not even be displayed.
   * @note The force returned
   */
  onTabAdd?: (() => void) | null
}
