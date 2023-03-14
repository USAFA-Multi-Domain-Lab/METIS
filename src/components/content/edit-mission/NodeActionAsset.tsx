// This will render an asset

import { useStore } from 'react-context-hook'
import { Asset } from '../../../modules/assets'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
import { DetailDropDown } from '../form/Form'
import AssetMechanism from './AssetMechanism'
import './NodeActionAsset.scss'

// drop down to a action.
export default function NodeActionAsset(props: {
  action: MissionNodeAction
  assets: Array<Asset>
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let assets: Array<Asset> = props.assets
  let handleChange = props.handleChange

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

  /* -- RENDER -- */

  if (assets.length > 0 && !action.addAssetButtonIsDisplayed) {
    return (
      <div className='Asset'>
        <DetailDropDown<Asset>
          label={`Asset`}
          options={assets}
          currentValue={action.selectedAsset}
          renderDisplayName={(asset: Asset) => asset.name}
          deliverValue={(asset: Asset) => {
            action.selectedAsset = asset
            setForcedUpdateCounter(forcedUpdateCounter + 1)
          }}
          key={`action-${action.actionID}_asset`}
        />
        <AssetMechanism action={action} handleChange={handleChange} />
      </div>
    )
  } else {
    return null
  }
}
