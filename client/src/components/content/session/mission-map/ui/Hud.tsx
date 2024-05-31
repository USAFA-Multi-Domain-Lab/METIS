import { TButtonSvg } from 'src/components/content/user-controls/ButtonSvg'
import ClientMission from 'src/missions'
import { TWithKey } from '../../../../../../../shared/toolbox/objects'
import './Hud.scss'
import TitleBar from './TitleBar'
import Tab from './tabs'
import TabBar from './tabs/TabBar'

/**
 * HUD for the mission map.
 */
export default function Hud({
  mission,
  buttons = [],
}: THud): JSX.Element | null {
  /* -- render -- */

  // Render root element.
  return (
    <div className='Hud'>
      <TitleBar title={mission.name} buttons={buttons} />
      <TabBar>
        <Tab text='Master' color={'#ffffff'} />
        <Tab text='Friendly Force' color={'#52b1ff'} />
        <Tab text='Enemy Force' color={'#f1696f'} />
      </TabBar>
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
}
