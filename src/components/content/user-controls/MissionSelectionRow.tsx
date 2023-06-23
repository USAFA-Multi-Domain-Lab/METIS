import { Mission } from '../../../modules/missions'
import Tooltip from '../communication/Tooltip'
import './MissionSelectionRow.scss'
import { AppActions } from '../../AppState'
import MissionModificationPanel from '../user-controls/MissionModificationPanel'
import { useStore } from 'react-context-hook'
import { IUser } from '../../../modules/users'

// This will render a row on the page
// for the given mission.
export default function MissionSelectionRow(props: {
  mission: Mission
  appActions: AppActions
  setMountHandled: (mountHandled: boolean) => void
}): JSX.Element | null {
  /* -- GLOBAL STATE -- */
  const [currentUser] = useStore<IUser | null>('currentUser')

  /* -- COMPONENT VARIABLES -- */
  let mission: Mission = props.mission
  let appActions: AppActions = props.appActions
  let setMountHandled = props.setMountHandled

  /* -- COMPONENT FUNCTIONS -- */

  // This loads the mission in session from the database
  // and stores it in a global state to be used on the GamePage
  // where the Mission Map renders
  const selectMission = () => {
    if (
      currentUser &&
      (currentUser.role === 'admin' || currentUser.role === 'student')
    ) {
      appActions.goToPage('GamePage', {
        missionID: mission.missionID,
      })
    } else {
      appActions.notify('You must be logged in to select a mission.')
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
        handleSuccessfulCopy={() => setMountHandled(false)}
        handleSuccessfulDeletion={() => setMountHandled(false)}
        handleSuccessfulToggleLive={() => {}}
      />
    </div>
  )
}
