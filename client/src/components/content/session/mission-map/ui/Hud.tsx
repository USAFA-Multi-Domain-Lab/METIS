import { TButtonSvg } from 'src/components/content/user-controls/ButtonSvg'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import { TWithKey } from '../../../../../../../shared/toolbox/objects'
import './Hud.scss'
import TitleBar from './TitleBar'
import TabBar, { TTabBarTab } from './tabs/TabBar'

/**
 * HUD for the mission map.
 */
export default function Hud({
  mission,
  buttons = [],
  onTabSelect = () => {},
  onTabAdd = null,
}: THud): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The tabs to display in the tab bar.
   */
  const tabs = compute(() => {
    // Define tab list with master tab.
    let tabs: TTabBarTab[] = [
      { _id: 'master', text: 'Master', color: '#ffffff' },
    ]

    // Add force tabs.
    mission.forces.forEach((force) => {
      tabs.push({
        _id: force._id,
        text: force.name,
        color: force.color,
      })
    })

    // Return tabs.
    return tabs
  })

  /* -- RENDER -- */

  // Render root element.
  return (
    <div className='Hud'>
      <TitleBar title={mission.name} buttons={buttons} />
      <TabBar tabs={tabs} onTabSelect={onTabSelect} onTabAdd={onTabAdd} />
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
   * The buttons to display.
   * @default []
   */
  buttons?: TWithKey<TButtonSvg>[]
  /**
   * Callback for when the user selects a tab.
   * @param tab The tab that was selected.
   * @default () => {}
   */
  onTabSelect?: (tab: TTabBarTab) => void
  /**
   * Callback for when a new tab is requested.
   * @default null
   * @note If null, the add button will not even be displayed.
   * @note The force returned
   */
  onTabAdd?: (() => void) | null
}
