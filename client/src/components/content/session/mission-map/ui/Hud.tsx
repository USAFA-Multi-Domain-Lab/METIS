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
      <TabBar
        tabs={
          tabs
          // [
          // { _id: 'master', text: 'Master', color: '#ffffff' },
          // { _id: 'friendly-force', text: 'Friendly Force', color: '#52b1ff' },
          // { _id: 'enemy-force', text: 'Enemy Force', color: '#f1696f' },
          // { _id: 'guerrilla-force', text: 'Guerrilla Force', color: '#f7d154' },
          // {
          //   _id: 'local-national-force',
          //   text: 'Local National Force',
          //   color: '#7ed321',
          // },
          // // White Cell | White
          // { _id: 'white-cell', text: 'White Cell', color: '#ffffff' },
          // // Non-State Actors | Brown
          // {
          //   _id: 'non-state-actors',
          //   text: 'Non-State Actors',
          //   color: '#ce9563',
          // },
          // // Coalition Force | Bright Purple
          // { _id: 'coalition-force', text: 'Coalition Force', color: '#b36ae2' },
          // // Civilian Industry | Magenta
          // {
          //   _id: 'civilian-industry',
          //   text: 'Civilian Industry',
          //   color: '#ff66cc',
          // },
          // ]
        }
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
