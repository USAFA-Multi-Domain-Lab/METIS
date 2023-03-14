// This will render the list of assets

import { useStore } from 'react-context-hook'
import { Asset } from '../../../modules/assets'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
import Tooltip from '../communication/Tooltip'
import NodeActionAsset from './NodeActionAsset'
import './NodeActionAssets.scss'

// that the user previously selected
export default function NodeActionAssets(props: {
  action: MissionNodeAction
  assets: Array<Asset>
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let assets: Array<Asset> = props.assets
  let handleChange = props.handleChange
  let addAssetClassName: string = 'FormButton AddAsset'
  let cancelAssetClassName: string = 'Hidden'

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

  /* -- COMPONENT FUNCTIONS -- */
  const removeAsset = (mechanismStateID: string) => {
    action.mechanismStateIDs.splice(
      action.mechanismStateIDs.indexOf(mechanismStateID),
      1,
    )
    handleChange()
  }

  // This allows the user to add an asset to the
  // affected asset list.
  const addAsset = () => {
    action.addAssetButtonIsDisplayed = false
    action.cancelAssetButtonIsDisplayed = true
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // This allows the user to be able to cancel adding
  // an asset to the affected asset list.
  const cancelAsset = () => {
    action.addAssetButtonIsDisplayed = true
    action.cancelAssetButtonIsDisplayed = false

    if (action.selectedAsset && action.selectedAsset.selectedMechanism) {
      action.selectedAsset.selectedMechanism.selectedState = null
    }
    if (action.selectedAsset) {
      action.selectedAsset.selectedMechanism = null
    }
    action.selectedAsset = null
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  /* -- RENDER -- */

  // Logic to hide the add asset button and
  // display the cancel button
  if (!action.addAssetButtonIsDisplayed) {
    addAssetClassName += ' Hidden'
    cancelAssetClassName = 'FormButton'
  }

  // Logic to hide the cancel button
  if (!action.cancelAssetButtonIsDisplayed) {
    cancelAssetClassName += ' Hidden'
  }

  if (action.mechanismStateIDs.length > 0) {
    return (
      <div className='Assets'>
        <h5 className='AssetInfo'>Asset(s):</h5>
        <div className='AssetListTitle'>Assets that will be affected:</div>
        <div className='SelectedAssetListContainer'>
          {action.mechanismStateIDs.map(
            (mechanismStateID: string, index: number) => {
              return (
                <div
                  className='SelectedAssetList'
                  key={`action-${action.actionID}_mechanismState-${mechanismStateID}`}
                >
                  <div className='SelectedAsset'>{mechanismStateID} </div>
                  <div
                    className='RemoveAssetButton'
                    onClick={() => removeAsset(mechanismStateID)}
                  >
                    x
                    <Tooltip description='Remove asset.' />
                  </div>
                </div>
              )
            },
          )}
        </div>

        <NodeActionAsset
          action={action}
          assets={assets}
          handleChange={handleChange}
        />

        <div className='ButtonContainer'>
          <div
            className={addAssetClassName}
            key={`${action.actionID}_addAsset`}
          >
            <span className='Text' onClick={() => addAsset()}>
              <span className='LeftBracket'>[</span> Add Asset{' '}
              <span className='RightBracket'>]</span>
              <Tooltip description='Add an asset that the action will affect upon successful execution.' />
            </span>
          </div>

          <div
            className={cancelAssetClassName}
            key={`${action.actionID}_cancelAsset`}
          >
            <span className='Text' onClick={() => cancelAsset()}>
              <span className='LeftBracket'>[</span> Cancel{' '}
              <span className='RightBracket'>]</span>
            </span>
          </div>
        </div>
      </div>
    )
  } else if (action.mechanismStateIDs.length === 0) {
    return (
      <div className='Assets'>
        <NodeActionAsset
          action={action}
          assets={assets}
          handleChange={handleChange}
        />
        <div className='ButtonContainer'>
          <div
            className={addAssetClassName}
            key={`${action.actionID}_addAsset`}
          >
            <span className='Text' onClick={() => addAsset()}>
              <span className='LeftBracket'>[</span> Add Asset{' '}
              <span className='RightBracket'>]</span>
              <Tooltip description='Add an asset that the action will affect upon successful execution.' />
            </span>
          </div>

          <div
            className={cancelAssetClassName}
            key={`${action.actionID}_cancelAsset`}
          >
            <span className='Text' onClick={() => cancelAsset()}>
              <span className='LeftBracket'>[</span> Cancel{' '}
              <span className='RightBracket'>]</span>
            </span>
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}
