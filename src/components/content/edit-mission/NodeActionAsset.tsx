import { MissionNodeAction } from '../../../modules/mission-node-actions'
import './NodeActionAsset.scss'
import Tooltip from '../communication/Tooltip'
import { useState } from 'react'
import { AnyObject } from '../../../modules/toolbox/objects'
import { assetTestData } from '../../../asset-test-data'

// This will render an asset
// drop down to a action.
export default function NodeActionAsset(props: {
  action: MissionNodeAction
  isEmptyString: boolean
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let isEmptyString: boolean = props.isEmptyString
  let handleChange = props.handleChange
  let assets: AnyObject = assetTestData

  /* -- COMPONENT STATE -- */
  const [assetPath, setAssetPath] = useState<Array<string>>([])
  const [assetOptions, setAssetOptions] = useState<Array<string>>(
    Object.keys(assets),
  )
  const [addAssetButtonIsDisplayed, setAddAssetButtonIsDisplayed] =
    useState<boolean>(true)
  const [cancelAssetButtonIsDisplayed, setCancelAssetButtonIsDisplayed] =
    useState<boolean>(false)

  /* -- COMPONENT FUNCTIONS -- */

  // This allows the user to add an asset to the
  // affected asset list.
  const addAsset = () => {
    setAddAssetButtonIsDisplayed(false)
    setCancelAssetButtonIsDisplayed(true)
  }

  // This allows the user to be able to cancel adding
  // an asset to the affected asset list.
  const cancelAsset = () => {
    setAddAssetButtonIsDisplayed(true)
    setCancelAssetButtonIsDisplayed(false)
    setAssetPath([])
    setAssetOptions(Object.keys(assetTestData))
  }

  // This adds the selected commandScript to an
  // array stored in each action so that the user
  // can see it in the affected asset list.
  // Upon submission the drop-down lists are reset
  // to their default state, the add asset button
  // is displayed and the user is able to save the mission.
  const submitAsset = () => {
    action.commandScripts.push(currentAssetPath)
    setAddAssetButtonIsDisplayed(true)
    handleChange()
    setAssetPath([])
    setAssetOptions(Object.keys(assetTestData))
  }

  const updateCurrentAssetStructureLocation = () => {
    // Updates the structure, or path, based on
    // which assets are selected.
    for (let asset of assetPath) {
      if (assets[asset] !== undefined) {
        assets = assets[asset]
      }
    }

    // Grabs the next set of assets the user will
    // be able to select from.
    let nextAssetOptions: Array<string> = Object.keys(assets)
    if (!nextAssetOptions.includes('0')) {
      setAssetOptions(nextAssetOptions)
    } else {
      setAssetOptions([])
      setAddAssetButtonIsDisplayed(false)
      setCancelAssetButtonIsDisplayed(false)
    }
  }

  // Called when a user selects an asset. Works similar
  // to a file explorer.
  const handleAssetSelection = (assetOption: string) => {
    // Adds selected asset to the path for the user
    // to see.
    assetPath.push(assetOption)

    updateCurrentAssetStructureLocation()
  }

  const handleBackClick = () => {
    assetPath.pop()
    updateCurrentAssetStructureLocation()
    if (!cancelAssetButtonIsDisplayed) {
      setCancelAssetButtonIsDisplayed(true)
    }
  }

  /* -- RENDER -- */

  // Default class names
  let currentAssetPath: string = 'Select a Facility:'
  let submitAssetClassName: string = 'Hidden'
  let addAssetClassName: string = 'FormButton AddAsset'
  let cancelAssetClassName: string = 'Hidden'
  let backButtonClassName: string = 'Hidden'
  let assetPathClassName: string = 'AssetPath'

  // Displays the current path selected.
  if (assetPath.length > 0) {
    currentAssetPath = assetPath.join('/')
    backButtonClassName = 'BackButton'
    assetPathClassName += ' AndBackButton'
  }

  // Logic to hide/display the submit asset button
  if (!cancelAssetButtonIsDisplayed && !addAssetButtonIsDisplayed) {
    submitAssetClassName = 'FormButton'
    assetPathClassName += ' EndOfAssetPath'
  } else if (cancelAssetButtonIsDisplayed || addAssetButtonIsDisplayed) {
    submitAssetClassName += ' Hidden'
  }

  // Logic to hide the add asset button and
  // display the cancel button
  if (!addAssetButtonIsDisplayed) {
    addAssetClassName += ' Hidden'
    cancelAssetClassName = 'FormButton'
  }

  // Logic to hide the cancel button
  if (!cancelAssetButtonIsDisplayed) {
    cancelAssetClassName += ' Hidden'
  }

  // If a field is left empty on the node
  // level or the action level then
  // the addAsset button is disabled.
  if (isEmptyString) {
    addAssetClassName += ' Disabled'
  }

  if (!addAssetButtonIsDisplayed) {
    return (
      <>
        <div className='Asset'>
          <div className={assetPathClassName}>
            <span className={backButtonClassName} onClick={handleBackClick}>
              &lt;
            </span>{' '}
            {currentAssetPath}
          </div>
          <div className='AssetOptions'>
            {assetOptions.map((assetOption: string) => {
              return (
                <div
                  className='AssetOption'
                  onClick={() => handleAssetSelection(assetOption)}
                  key={`action-${action.actionID}_asset-${assetOption}`}
                >
                  {assetOption}
                </div>
              )
            })}
          </div>
        </div>

        <div className='ButtonContainer'>
          <div
            className={cancelAssetClassName}
            key={`${action.actionID}_cancelAsset`}
          >
            <span className='Text' onClick={() => cancelAsset()}>
              <span className='LeftBracket'>[</span> Cancel{' '}
              <span className='RightBracket'>]</span>
            </span>
          </div>
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
  } else if (addAssetButtonIsDisplayed) {
    return (
      <div className='ButtonContainer'>
        <div className={addAssetClassName} key={`${action.actionID}_addAsset`}>
          <span className='Text' onClick={() => addAsset()}>
            <span className='LeftBracket'>[</span> Add Asset{' '}
            <span className='RightBracket'>]</span>
            <Tooltip description='Add an asset that the action will affect upon successful execution.' />
          </span>
        </div>
      </div>
    )
  } else {
    return null
  }
}
