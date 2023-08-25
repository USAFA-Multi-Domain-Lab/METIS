import { Mission } from '../../../modules/missions'
import Tooltip from '../communication/Tooltip'
import './MissionSelectionRow.scss'
import { AppActions } from '../../AppState'
import MissionModificationPanel from '../user-controls/MissionModificationPanel'
import { useStore } from 'react-context-hook'
import { TMetisSession, User, userRoles } from '../../../modules/users'
import { Game, GameClient } from '../../../modules/games'
import { AxiosError } from 'axios'
import ServerConnection from 'src/modules/connect/server-connect'

// This will render a row on the page
// for the given mission.
export default function MissionSelectionRow(props: {
  mission: Mission
  handleSelection: () => void
  appActions: AppActions
  remountPage: () => void
}): JSX.Element | null {
  /* -- GLOBAL STATE -- */

  const [session] = useStore<TMetisSession>('session')
  const [server] = useStore<ServerConnection | null>('server')

  /* -- COMPONENT VARIABLES -- */

  let { mission, handleSelection, appActions, remountPage } = props

  /* -- RENDER -- */

  return (
    <div className='MissionSelectionRow'>
      <div className='MissionName' onClick={handleSelection}>
        {mission.name}
        <Tooltip description='Launch mission.' />
      </div>
      <MissionModificationPanel
        mission={mission}
        appActions={appActions}
        handleSuccessfulCopy={remountPage}
        handleSuccessfulDeletion={remountPage}
        handleSuccessfulToggleLive={() => {}}
      />
    </div>
  )
}
