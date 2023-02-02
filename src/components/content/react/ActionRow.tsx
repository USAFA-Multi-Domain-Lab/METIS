import { Mission } from '../../../modules/missions'
import { EAjaxStatus } from '../../../modules/toolbox/ajax'
import Toggle, { EToggleLockState } from './Toggle'
import Tooltip from './Tooltip'
import '../sass/ActionRow.scss'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import AppState from '../../AppState'

// This will render a row on the page
// for the given mission.
export default function ActionRow(props: {
  mission: Mission
  uniqueClassName?: string
  innerText: string
  tooltipDescription?: string
  liveAjaxStatus: EAjaxStatus
  appState: AppState
  handleSelectionRequest?: () => void
  handleEditRequest: () => void
  handleDeleteRequest: () => void
  handleCopyRequest: () => void
  handleToggleLiveRequest: (live: boolean) => void
}): JSX.Element | null {
  // Global variables
  let mission: Mission = props.mission
  let uniqueClassName: string | undefined = props.uniqueClassName
  let innerText: string = props.innerText
  let tooltipDescription: string | undefined = props.tooltipDescription
  let liveAjaxStatus: EAjaxStatus = props.liveAjaxStatus
  let appState: AppState = props.appState
  let currentActions: MiniButtonSVG[] = []
  let availableMiniActions = {
    edit: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Edit,
      handleClick: props.handleEditRequest,
      tooltipDescription: 'Edit mission.',
    }),
    remove: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Remove,
      handleClick: props.handleDeleteRequest,
      tooltipDescription: 'Remove mission.',
    }),
    copy: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Copy,
      handleClick: props.handleCopyRequest,
      tooltipDescription: 'Copy mission.',
    }),
    download: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Download,
      handleClick: () => {
        window.open(
          `/api/v1/missions/export/${mission.name}.cesar?missionID=${mission.missionID}`,
          '_blank',
        )
      },
      tooltipDescription:
        'Export this mission as a .cesar file to your local system.',
    }),
  }

  // -- RENDER --

  let actionsContainerClassName: string = 'ActionsContainer'

  if (uniqueClassName === undefined) {
    uniqueClassName = 'NoClassName'
  }

  if (tooltipDescription === undefined) {
    tooltipDescription = ''
  }

  if (appState.currentUser !== null) {
    actionsContainerClassName += ' InstructorView'
  }

  // Logic that will lock the mission toggle while a request is being sent
  // to set the mission.live paramter
  let lockLiveToggle: EToggleLockState = EToggleLockState.Unlocked
  if (liveAjaxStatus === EAjaxStatus.Loading && mission.live) {
    lockLiveToggle = EToggleLockState.LockedActivation
  } else if (liveAjaxStatus === EAjaxStatus.Loading && !mission.live) {
    lockLiveToggle = EToggleLockState.LockedDeactivation
  } else {
    lockLiveToggle = EToggleLockState.Unlocked
  }

  currentActions.push(
    availableMiniActions.edit,
    availableMiniActions.remove,
    availableMiniActions.copy,
    availableMiniActions.download,
  )

  return (
    <div className='ActionRow'>
      <div className={uniqueClassName} onClick={props.handleSelectionRequest}>
        {innerText}
        <Tooltip description={tooltipDescription} />
      </div>
      <div className={actionsContainerClassName}>
        <MiniButtonSVGPanel buttons={currentActions} linkBack={null} />
        <div className='ToggleContainer'>
          <Toggle
            initiallyActivated={mission.live}
            lockState={lockLiveToggle}
            deliverValue={props.handleToggleLiveRequest}
          />
          <Tooltip
            description={
              !mission.live
                ? 'Sets mission as live thus allowing students to access it.'
                : 'Disables mission thus preventing students from accessing it.'
            }
          />
        </div>
      </div>
    </div>
  )
}
