import { Mission } from '../../../modules/missions'
import { EAjaxStatus } from '../../../modules/toolbox/ajax'
import Toggle, { EToggleLockState } from './Toggle'
import Tooltip from './Tooltip'
import '../sass/MissionSelectionRow.scss'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'

// This will render a row on the page
// for the given mission.
export default function MissionSelectionRow(props: {
  mission: Mission
  liveAjaxStatus: EAjaxStatus
  handleSelectionRequest: () => void
  handleEditRequest: () => void
  handleDeleteRequest: () => void
  handleCopyRequest: () => void
  handleToggleLiveRequest: (live: boolean) => void
}): JSX.Element | null {
  let mission: Mission = props.mission
  let liveAjaxStatus: EAjaxStatus = props.liveAjaxStatus
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

  // Logic for missions to appear/disappear for students
  // based on what the instructor sets the individual
  // mission to.
  let missionSelectionRowClassName: string = 'MissionSelectionRow'

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
    <div className={missionSelectionRowClassName}>
      <div className='MissionName' onClick={props.handleSelectionRequest}>
        {mission.name}
        <Tooltip description={'Launch mission.'} />
      </div>
      <div className='ActionsContainer'>
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
