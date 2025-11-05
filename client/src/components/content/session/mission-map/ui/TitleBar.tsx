import ButtonSvgPanel from 'metis/client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useMapContext } from '../MissionMap'
import './TitleBar.scss'

/**
 * A bar with tabs that can be clicked to change the view.
 */
export default function TabBar(): TReactElement | null {
  /* -- STATE -- */

  const mapContext = useMapContext()
  const { mission, buttonEngine } = mapContext

  /* -- RENDER -- */

  // Render root JSX.
  return (
    <div className='TitleBar'>
      <div className='Title'>
        Mission: <span className='MissionName'>{mission.name}</span>
      </div>
      <ButtonSvgPanel engine={buttonEngine} />
    </div>
  )
}
