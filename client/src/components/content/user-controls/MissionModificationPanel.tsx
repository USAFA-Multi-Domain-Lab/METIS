import { useGlobalContext } from 'src/context'
import GameClient from 'src/games'
import ClientMission from 'src/missions'
import ClientUser from 'src/users'
import { TMetisSession } from '../../../../../shared/sessions'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import './MissionModificationPanel.scss'

export default function MissionModificationPanel(props: {
  mission: ClientMission
  session: NonNullable<TMetisSession<ClientUser>>
  handleSuccessfulCopy: (resultingMission: ClientMission) => void
  handleSuccessfulDeletion: () => void
}) {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const {
    navigateTo,
    notify,
    confirm,
    beginLoading,
    finishLoading,
    handleError,
  } = globalContext.actions
  const [server] = globalContext.server

  /* -- COMPONENT VARIABLES -- */

  let mission: ClientMission = props.mission
  let session: NonNullable<TMetisSession<ClientUser>> = props.session
  let currentActions: MiniButtonSVG[] = []
  let handleSuccessfulDeletion = props.handleSuccessfulDeletion
  let handleSuccessfulCopy = props.handleSuccessfulCopy

  // Grab the current user from the session.
  let { user: currentUser } = session

  /* -- COMPONENT FUNCTIONS -- */

  // This is called when a user requests
  // to edit the mission.
  const handleEditRequest = () => {
    navigateTo('MissionFormPage', {
      missionID: mission.missionID,
    })
  }

  // This is called when a user requests
  // to delete the mission.
  const handleDeleteRequest = () => {
    confirm(
      'Are you sure you want to delete this mission?',
      async (concludeAction: () => void) => {
        try {
          beginLoading('Deleting mission...')
          concludeAction()
          await ClientMission.$delete(mission.missionID)
          finishLoading()
          notify(`Successfully deleted "${mission.name}".`)
          handleSuccessfulDeletion()
        } catch (error) {
          finishLoading()
          notify(`Failed to delete "${mission.name}".`)
        }
      },
      {
        pendingMessageUponConfirm: 'Deleting mission...',
      },
    )
  }

  // This is called when a user requests
  // to copy the mission.
  const handleCopyRequest = () => {
    confirm(
      'Enter the name of the new mission.',
      async (concludeAction: () => void, entry: string) => {
        try {
          beginLoading('Copying mission...')
          concludeAction()
          let resultingMission = await ClientMission.$copy(
            mission.missionID,
            entry,
          )
          finishLoading()
          notify(`Successfully copied "${mission.name}".`)
          handleSuccessfulCopy(resultingMission)
        } catch (error) {
          finishLoading()
          notify(`Failed to copy "${mission.name}".`)
        }
      },
      {
        requireEntry: true,
        entryLabel: 'Name',
        buttonConfirmText: 'Copy',
        pendingMessageUponConfirm: 'Copying mission...',
      },
    )
  }

  // -- RENDER --

  let availableMiniActions = {
    launch: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Launch,
      handleClick: async () => {
        if (server !== null) {
          try {
            // Notify user of game launch.
            beginLoading('Launching game...')
            // Launch game from mission ID, awaiting
            // the promised game ID.
            let gameID: string = await GameClient.$launch(mission.missionID)
            // Notify user of game join.
            beginLoading('Joining game...')
            // Join game from new game ID, awaiting
            // the promised game client.
            let game = await server.$joinGame(gameID)
            // Update session data to include new
            // game ID.
            session.gameID = game.gameID
            // Go to the game page with the new
            // game client.
            navigateTo('GamePage', { game })
          } catch (error) {
            handleError({
              message: 'Failed to launch game. Contact system administrator.',
              notifyMethod: 'page',
            })
          }
        } else {
          handleError({
            message: 'No server connection. Contact system administrator',
            notifyMethod: 'bubble',
          })
        }
      },
      tooltipDescription: 'Launch game.',
    }),
    edit: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Edit,
      handleClick: handleEditRequest,
      tooltipDescription: 'Edit mission.',
    }),
    remove: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Remove,
      handleClick: handleDeleteRequest,
      tooltipDescription: 'Remove mission.',
    }),
    copy: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Copy,
      handleClick: handleCopyRequest,
      tooltipDescription: 'Copy mission.',
    }),
    download: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Download,
      handleClick: () => {
        window.open(
          `/api/v1/missions/export/${mission.name}.metis?missionID=${mission.missionID}`,
          '_blank',
        )
      },
      tooltipDescription:
        'Export this mission as a .metis file to your local system.',
    }),
  }

  let containerClassName: string = 'Hidden'

  if (currentUser.isAuthorized(['READ', 'WRITE', 'DELETE'])) {
    containerClassName = 'MissionModificationPanel'
  }

  currentActions.push(
    availableMiniActions.launch,
    availableMiniActions.remove,
    availableMiniActions.copy,
    availableMiniActions.download,
  )

  return (
    <div className={containerClassName}>
      <MiniButtonSVGPanel buttons={currentActions} />
    </div>
  )
}
