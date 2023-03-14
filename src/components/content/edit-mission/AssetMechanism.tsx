import { useStore } from 'react-context-hook'
import { Mechanism } from '../../../modules/mechanisms'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
import { DetailDropDown } from '../form/Form'
import AssetMechanismMechanismState from './AssetMechanismMechanismState'
import './AssetMechanism.scss'

export default function AssetMechanism(props: {
  action: MissionNodeAction
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let handleChange = props.handleChange
  let currentMechanismOptions: Array<Mechanism> = []

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

  /* -- RENDER -- */

  if (action.selectedAsset) {
    // Creates the list of mechanism options for
    // the user to select from
    currentMechanismOptions = action.selectedAsset.mechanisms

    return (
      <>
        <DetailDropDown<Mechanism>
          label='Asset Mechanism'
          options={currentMechanismOptions}
          currentValue={action.selectedAsset.selectedMechanism}
          renderDisplayName={(mechanism: Mechanism) => mechanism.name}
          deliverValue={(mechanism: Mechanism) => {
            if (action.selectedAsset) {
              action.selectedAsset.selectedMechanism = mechanism
              setForcedUpdateCounter(forcedUpdateCounter + 1)
            }
          }}
          key={`action-${action.actionID}_mechanism`}
        />
        <AssetMechanismMechanismState
          action={action}
          handleChange={handleChange}
        />
      </>
    )
  } else {
    return null
  }
}
