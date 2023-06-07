import { useState } from 'react'
import { Mission, setLive } from '../../../modules/missions'
import { EAjaxStatus } from '../../../modules/toolbox/ajax'
import { AppActions } from '../../AppState'
import { Detail, DetailBox, DetailNumber, DetailToggle } from '../form/Form'
import './MissionEntry.scss'

// This will render the basic editable
// details of the mission itself.
export default function MissionEntry(props: {
  active: boolean
  mission: Mission
  appActions: AppActions
  missionEmptyStringArray: Array<string>
  setMissionEmptyStringArray: (missionEmptyString: Array<string>) => void
  handleChange: () => void
}): JSX.Element | null {
  let active: boolean = props.active
  let mission: Mission = props.mission
  let appActions: AppActions = props.appActions
  let missionEmptyStringArray: Array<string> = props.missionEmptyStringArray
  let setMissionEmptyStringArray: (missionEmptyString: Array<string>) => void =
    props.setMissionEmptyStringArray
  let handleChange = props.handleChange

  /* -- COMPONENT STATE -- */
  const [liveAjaxStatus, setLiveAjaxStatus] = useState<EAjaxStatus>(
    EAjaxStatus.NotLoaded,
  )

  /* -- COMPONENT FUNCTIONS -- */
  const removeMissionEmptyString = (field: string) => {
    missionEmptyStringArray.map((missionEmptyString: string, index: number) => {
      if (
        missionEmptyString === `missionID=${mission.missionID}_field=${field}`
      ) {
        missionEmptyStringArray.splice(index, 1)
      }
    })
  }

  // This is called when a user requests
  // to toggle a mission between being live
  // and not being live.
  const handleToggleLiveRequest = (live: boolean) => {
    let previousLiveState: boolean = mission.live

    mission.live = live

    setLive(
      mission.missionID,
      live,
      () => {
        if (live) {
          appActions.notify(`${mission.name} was successfully turned on.`)
          setLiveAjaxStatus(EAjaxStatus.Loaded)
        } else {
          appActions.notify(`${mission.name} was successfully turned off.`)
          setLiveAjaxStatus(EAjaxStatus.Loaded)
        }
      },
      () => {
        if (live) {
          appActions.notify(`${mission.name} failed to turn on.`)
          setLiveAjaxStatus(EAjaxStatus.Error)
        } else {
          appActions.notify(`${mission.name} failed to turn off.`)
          setLiveAjaxStatus(EAjaxStatus.Error)
        }
        mission.live = previousLiveState
      },
    )
    setLiveAjaxStatus(EAjaxStatus.Loading)
  }

  if (active) {
    return (
      <div className='MissionEntry SidePanel'>
        <div className='BorderBox'>
          <div className='BoxTop'>
            <div className='ErrorMessage Hidden'></div>
          </div>
          <div className='SidePanelSection MainDetails'>
            <Detail
              label='Name'
              initialValue={mission.name}
              deliverValue={(name: string) => {
                if (name !== '') {
                  mission.name = name
                  removeMissionEmptyString('name')
                  handleChange()
                } else {
                  setMissionEmptyStringArray([
                    ...missionEmptyStringArray,
                    `missionID=${mission.missionID}_field=name`,
                  ])
                }
              }}
              key={`${mission.missionID}_name`}
            />
            <DetailToggle
              label={'Live'}
              initialValue={mission.live}
              deliverValue={(live: boolean) => {
                handleToggleLiveRequest(live)
                handleChange()
              }}
            />
            <DetailNumber
              label='Initial Resources'
              initialValue={mission.initialResources}
              deliverValue={(initialResources: number | null) => {
                if (initialResources !== null) {
                  mission.initialResources = initialResources
                  handleChange()
                }
              }}
              key={`${mission.missionID}_initialResources`}
            />
            <DetailBox
              label='Introduction Message'
              initialValue={'Enter your overview message here.'}
              deliverValue={(studentOverviewMessage: string) => {}}
              key={`${mission.missionID}_studentOverviewMessage`}
            />
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}
