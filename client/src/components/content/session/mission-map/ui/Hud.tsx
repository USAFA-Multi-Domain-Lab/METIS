import { TButtonSvg } from 'src/components/content/user-controls/ButtonSvg'
import ClientMission from 'src/missions'
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
}: THud): JSX.Element | null {
  /* -- render -- */

  // Render root element.
  return (
    <div className='Hud'>
      <TitleBar title={mission.name} buttons={buttons} />
      <TabBar
        tabs={[
          { _id: 'master', text: 'Master', color: '#ffffff' },
          { _id: 'friendly-force', text: 'Friendly Force', color: '#52b1ff' },
          { _id: 'enemy-force', text: 'Enemy Force', color: '#f1696f' },
        ]}
        onTabSelect={onTabSelect}
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
}
