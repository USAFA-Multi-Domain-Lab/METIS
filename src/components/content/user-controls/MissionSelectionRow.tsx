import { Mission } from '../../../modules/missions'
import Tooltip from '../communication/Tooltip'
import './MissionSelectionRow.scss'
import { AppActions } from '../../AppState'
import MissionModificationPanel from '../user-controls/MissionModificationPanel'
import { useStore } from 'react-context-hook'
import { TMetisSession, User, userRoles } from '../../../modules/users'
import { Game } from '../../../modules/games'
import { AxiosError } from 'axios'

// This will render a row on the page
// for the given mission.
export default function MissionSelectionRow(props: {
  mission: Mission
  appActions: AppActions
  remountPage: () => void
}): JSX.Element | null {
  /* -- GLOBAL STATE -- */
  const [session] = useStore<TMetisSession>('session')

  /* -- COMPONENT VARIABLES -- */
  let mission: Mission = props.mission
  let appActions: AppActions = props.appActions
  let setMountHandled = props.remountPage

  /* -- COMPONENT FUNCTIONS -- */

  // This loads the mission in session from the database
  // and stores it in a global state to be used on the GamePage
  // where the Mission Map renders
  const selectMission = () => {
    let userRoleStringValues = Object.values(userRoles)

    if (userRoleStringValues.includes(session?.user.role)) {
      appActions.beginLoading('Launching mission...')

      Game.launch(mission).then(
        (game: Game) => {
          // Update the session with inGame as
          // true.
          if (session !== null) {
            session.inGame = true
          }
          // Go to the game page with the new
          // game.
          appActions.goToPage('GamePage', { game })
        },
        (error: AxiosError) => {
          if (error.response?.status === 401) {
            appActions.notify(
              'Please select a different mission. This mission is unauthorized.',
            )
          } else {
            appActions.finishLoading()
            appActions.handleError('Failed to launch mission.')
            props.remountPage()
          }
        },
      )
    }
  }

  return (
    <div className='MissionSelectionRow'>
      <div className='MissionName' onClick={selectMission}>
        {mission.name}
        <Tooltip description='Launch mission.' />
      </div>
      <MissionModificationPanel
        mission={mission}
        appActions={appActions}
        handleSuccessfulCopy={props.remountPage}
        handleSuccessfulDeletion={props.remountPage}
        handleSuccessfulToggleLive={() => {}}
      />
    </div>
  )
}
