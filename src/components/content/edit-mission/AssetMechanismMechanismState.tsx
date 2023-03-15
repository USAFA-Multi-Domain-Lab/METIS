import { useStore } from 'react-context-hook'
import { MechanismState } from '../../../modules/mechanism-state'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
import Tooltip from '../communication/Tooltip'
import { DetailDropDown } from '../form/Form'
import './AssetMechanismMechanismState.scss'

export default function AssetMechanismMechanismState(props: {
  action: MissionNodeAction
  isEmptyString: boolean
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let isEmptyString: boolean = props.isEmptyString
  let handleChange = props.handleChange
  let currentMechanismStateOptions: Array<MechanismState> = []

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

  /* -- COMPONENT FUNCTIONS -- */

  // This adds the selected mechanismStateID to an
  // array stored in each action so that the user
  // can see it in the affected asset list.
  // Upon submission the drop-down lists are reset
  // to their default state, the add asset button
  // is displayed and the user is able to save the mission.
  const submitAsset = () => {
    if (
      action.selectedAsset &&
      action.selectedAsset.selectedMechanism &&
      action.selectedAsset.selectedMechanism.selectedState
    ) {
      action.mechanismStateIDs.push(
        action.selectedAsset.selectedMechanism.selectedState.mechanismStateID,
      )
    }
    action.addAssetButtonIsDisplayed = true
    handleChange()
    if (action.selectedAsset && action.selectedAsset.selectedMechanism) {
      action.selectedAsset.selectedMechanism.selectedState = null
    }
    if (action.selectedAsset) {
      action.selectedAsset.selectedMechanism = null
    }
    action.selectedAsset = null
  }

  /* -- RENDER -- */

  let submitAssetClassName: string = 'Hidden'

  // Logic to hide/display the submit asset button
  if (
    !action.cancelAssetButtonIsDisplayed &&
    !action.addAssetButtonIsDisplayed
  ) {
    submitAssetClassName = 'FormButton'
  } else if (
    action.cancelAssetButtonIsDisplayed ||
    action.addAssetButtonIsDisplayed
  ) {
    submitAssetClassName += ' Hidden'
  }

  // if a field is left empty on the node
  // level or the action level then
  // the submit button is disabled.
  if (isEmptyString) {
    submitAssetClassName += ' Disabled'
  }

  if (
    action.selectedAsset &&
    action.selectedAsset.selectedMechanism &&
    !action.addAssetButtonIsDisplayed
  ) {
    // Creates a list of mechanism-state options
    // for the user to select from
    currentMechanismStateOptions = action.selectedAsset.selectedMechanism.states

    return (
      <>
        <DetailDropDown<MechanismState>
          label='Mechanism State'
          options={currentMechanismStateOptions}
          currentValue={action.selectedAsset.selectedMechanism.selectedState}
          renderDisplayName={(mechanismState: MechanismState) =>
            mechanismState.name
          }
          deliverValue={(mechanismState: MechanismState) => {
            if (
              action.selectedAsset &&
              action.selectedAsset.selectedMechanism
            ) {
              action.selectedAsset.selectedMechanism.selectedState =
                mechanismState
            }
            action.cancelAssetButtonIsDisplayed = false
            setForcedUpdateCounter(forcedUpdateCounter + 1)
          }}
          key={`action-${action.actionID}_mechanismState`}
        />

        <div className='ButtonContainer'>
          <div
            className={submitAssetClassName}
            key={`${action.actionID}_submitAsset`}
          >
            <span className='Text' onClick={() => submitAsset()}>
              <span className='LeftBracket'>[</span> Submit Asset{' '}
              <span className='RightBracket'>]</span>
              <Tooltip description='Submits asset to the list of assets that will be affected.' />
            </span>
          </div>
        </div>
      </>
    )
  } else {
    return null
  }
}
