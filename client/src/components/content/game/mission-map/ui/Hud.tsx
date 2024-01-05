import ClientMission from 'src/missions'
import './Hud.scss'

/**
 * HUD for the mission map.
 */
export default function Hud({ mission }: THud): JSX.Element | null {
  return (
    <div className='Hud'>
      <div className='Title'>{mission.name}</div>
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
}
