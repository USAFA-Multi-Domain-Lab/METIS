import MissionNodeAction, {
  IScript,
} from '../../../../../shared/missions/actions'
import './NodeActionAsset.scss'
import Tooltip from '../communication/Tooltip'
import { useState } from 'react'
import { AnyObject } from '../../../../../shared/toolbox/objects'
import AssetOption from './AssetOption'

const assetData = {}

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
  let assets: AnyObject = assetData
  let matchesIScriptProperties: boolean = false

  /* -- COMPONENT STATE -- */
  const [assetPath, setAssetPath] = useState<Array<string>>([])
  const [assetOptions, setAssetOptions] = useState<Array<string>>(
    Object.keys(assets),
  )
  const [selectedScript, setSelectedScript] = useState<IScript | null>(null)
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
    setAssetOptions(Object.keys(assetData))
  }

  // This adds the selected commandScript to an
  // array stored in each action so that the user
  // can see it in the affected asset list.
  // Upon submission the drop-down lists are reset
  // to their default state, the add asset button
  // is displayed and the user is able to save the mission.
  const submitAsset = () => {
    if (selectedScript !== null) {
      selectedScript.originalPath = assetPath.join('/')
      action.scripts.push(selectedScript)
    }
    setAddAssetButtonIsDisplayed(true)
    handleChange()
    setAssetPath([])
    setAssetOptions(Object.keys(assetData))
  }

  // Updates the structure, or path, based on
  // which assets are selected.
  const updateCurrentLocation = () => {
    for (let asset of assetPath) {
      if (assets[asset] !== undefined) {
        assets = assets[asset]
      }
    }
  }

  // Updates the current asset names that are
  // being displayed for the user.
  const updateAssetOptions = () => {
    // Goes to the next layer in the asset structure.
    updateCurrentLocation()

    // Grabs all the names of the sub-assets.
    let subAssetNames: Array<string> = Object.keys(assets)

    // Checks to see if this is the end of the structure.
    validateEndOfAssetPath(subAssetNames)

    if (matchesIScriptProperties) {
      // At the end of the structure
      // the submit asset button is displayed.
      setAssetOptions([])
      setAddAssetButtonIsDisplayed(false)
      setCancelAssetButtonIsDisplayed(false)
    } else {
      setAssetOptions(subAssetNames)
    }
  }

  // Checks to see if the user is at the end of the structure.
  const validateEndOfAssetPath = (subAssetNames: Array<string>) => {
    // This reflects the interface of a script
    // that will be saved to a mission-node-action.
    // This is used to check subAssets and see if
    // they cointain these properties which means a
    // user has reached the end of the asset structure.
    let iScriptProperties: IScript = {
      label: 'label',
      description: 'description',
      scriptName: 'scriptName',
      originalPath: 'originalPath',
      args: { args: 'args' },
    }

    // This loops through the subAssetNames that are passed
    // and validates if any of the script properties are there
    // to validate if the user has reached the end of the asset
    // structure.
    subAssetNames.forEach((subAsset: string) => {
      if (
        subAsset === iScriptProperties.label ||
        subAsset === iScriptProperties.description ||
        subAsset === iScriptProperties.scriptName ||
        subAsset === iScriptProperties.originalPath ||
        subAsset === iScriptProperties.args.args
      ) {
        matchesIScriptProperties = true
      }
    })
  }

  // Handles clicking the back arrow within
  // the asset finder.
  const handleBackClick = () => {
    assetPath.pop()

    // If the user is at the end of a structure
    // and can submit then when they hit the back
    // button this will remove the submit button
    // and display the cancel button.
    updateCurrentLocation()
    updateAssetOptions()

    // Removes the last asset that was added
    // to the asset path and updates the
    // asset structure to show the user
    // the correct options to choose from.
    if (!cancelAssetButtonIsDisplayed) {
      setCancelAssetButtonIsDisplayed(true)
    }
  }

  // Default class names
  let currentAssetPath: string = 'Select a Facility:'
  let submitAssetClassName: string = 'Hidden'
  let addAssetClassName: string = 'FormButton AddAsset'
  let cancelAssetClassName: string = 'Hidden'
  let backButtonClassName: string = 'Hidden'
  let assetPathClassName: string = 'AssetPath'
  let assetOptionsClassName: string = 'AssetOptions'
  let noAssetsText: string = 'No assets here...'

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

  if (assetOptions.length === 0 && cancelAssetButtonIsDisplayed) {
    assetOptionsClassName += ' NoAssets'
    assetOptions.push(noAssetsText)
  }

  if (!addAssetButtonIsDisplayed) {
    return (
      <>
        <div className='Asset'>
          <div className='AssetFinderTitle'>Asset Finder:</div>
          <div className={assetPathClassName}>
            <span className={backButtonClassName} onClick={handleBackClick}>
              &lt;
            </span>{' '}
            {currentAssetPath}
          </div>

          <div className={assetOptionsClassName}>
            {assetOptions.map((assetOption: string) => {
              // AssetOption was broken down into its own
              // function component so that each asset option
              // can expand and collapse individually.
              // (i.e., each AssetOption needed individual
              // react states)
              return (
                <AssetOption
                  action={action}
                  assetOption={assetOption}
                  assets={assets}
                  assetPath={assetPath}
                  updateAssetOptions={updateAssetOptions}
                  setSelectedScript={setSelectedScript}
                  key={`action-${action.actionID}_asset-${assetOption}`}
                />
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
