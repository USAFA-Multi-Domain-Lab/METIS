import { useState } from 'react'
import { useStore } from 'react-context-hook'
import {
  MissionNodeAction,
  IScript,
} from '../../../modules/mission-node-actions'
import { AnyObject } from '../../../modules/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import './AssetOption.scss'
import SubAssetOption from './SubAssetOption'

export default function AssetOption(props: {
  action: MissionNodeAction
  assetOption: string
  assetPath: Array<string>
  assets: AnyObject
  updateAssetOptions: () => void
  setSelectedScript: (selectedScript: IScript) => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let assetOption: string = props.assetOption
  let assetPath: Array<string> = props.assetPath
  let assets: AnyObject = props.assets
  let updateAssetOptions = props.updateAssetOptions
  let setSelectedScript = props.setSelectedScript
  let matchesIScriptProperties: boolean = false

  /* -- GLOBAL STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
    'forcedUpdateCounter',
  )

  /* -- COMPONENT STATE -- */
  const [subAssetOptions, setSubAssetOptions] = useState<Array<string>>([])
  const [selectedAssetOptions, setSelectedAssetOptions] = useState<
    Array<string>
  >([])

  /* -- COMPONENT FUNCTIONS -- */

  // Updates the structure, or path, based on
  // which assets are selected.
  const updateCurrentLocation = () => {
    for (let asset of assetPath) {
      if (assets[asset] !== undefined) {
        assets = assets[asset]
      }
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

  // Called when a user selects an asset. Works similar
  // to a file explorer.
  const handleAssetSelection = (assetOption: string) => {
    // Adds selected asset to the path for the user
    // to see.
    assetPath.push(assetOption)
    checkForSubAssets()

    // Checks if the selected asset option
    // matches the criteria to be able to
    // save to an action and selects the
    // object to be saved if it matches.
    if (matchesIScriptProperties) {
      let script: any = assets
      setSelectedScript(script)
    }

    // Collapses all previously expanded assets.
    setSelectedAssetOptions([])

    // Updates where the user is within the
    // asset structure and the available
    // asset options the user can select.
    updateCurrentLocation()
    updateAssetOptions()
  }

  // Expands and collapses assets with a folder icon.
  const toggleSubAssets = (selectedOption: string) => {
    if (
      selectedAssetOptions.includes(selectedOption) &&
      !matchesIScriptProperties
    ) {
      // Collapses the expanded asset.
      selectedAssetOptions.splice(
        selectedAssetOptions.indexOf(selectedOption),
        1,
      )
      setForcedUpdateCounter(forcedUpdateCounter + 1)
    } else {
      // Expands the collapsed asset.

      // Temporarily adds the current option to the asset path
      // to be able to go one layer deeper in the structure.
      assetPath.push(selectedOption)

      // Goes to the next layer in the asset structure.
      updateCurrentLocation()

      // Grabs all the names of the sub-assets.
      let subAssetNames: Array<string> = Object.keys(assets)

      selectedAssetOptions.push(selectedOption)
      setSubAssetOptions(subAssetNames)

      // Removes the asset that was added temporarily so that
      // the path can return to normal.
      assetPath.pop()
    }
  }

  // Checks if the current assets have sub-asset options.
  // If so, the user interface is updated to display properly.
  const checkForSubAssets = () => {
    // Temporarily adds the current option to the asset path
    // to be able to go one layer deeper in the structure.
    assetPath.push(assetOption)

    // Goes to the next layer in the asset structure.
    updateCurrentLocation()

    // Grabs all the names of the sub-assets.
    let subAssetNames: Array<string> = Object.keys(assets)

    // Checks to see if this is the end of the structure.
    validateEndOfAssetPath(subAssetNames)

    if (matchesIScriptProperties) {
      // Hides the expand/collapse icon
      // if the user is at the end of
      // the asset structure.
      indicatorClassName += ' Hidden'

      // Hides the folder icon
      // if the user is at the end of
      // the asset structure.
      folderClassName += ' Hidden'

      // Displays the file icon so that
      // the user knows that they are at
      // the end of the asset structure.
      fileClassName = 'File'

      // Displays short decription to let
      // the user know what each "file"
      // option will do upon submission.
      assetTooltipDescription = assets.description
    }

    //  Removes the asset that was added temporarily so that
    // the path can return to normal.
    assetPath.pop()
  }

  /* -- RENDER -- */

  // Default class names
  let indicatorClassName: string = 'Indicator'
  let folderClassName: string = 'Folder'
  let fileClassName: string = 'File Hidden'
  let assetTooltipDescription: string = ''

  if (selectedAssetOptions.includes(assetOption)) {
    indicatorClassName += ' isExpanded'
  } else {
    indicatorClassName = 'Indicator'
  }

  checkForSubAssets()

  return (
    <div className='AssetOption'>
      <svg
        className={indicatorClassName}
        onClick={() => toggleSubAssets(assetOption)}
      >
        <polygon points='3,7 10,7 6.5,14' className='Triangle' fill='#fff' />
      </svg>

      <svg fill='#fff' viewBox='0 0 32 32' className={folderClassName}>
        <path d='M11.086 5.5l2.457 2.414 0.629 0.586h15.829v18h-28v-21h9.086zM12 3.5h-10c-1.105 0-2 0.896-2 2v21c0 1.105 0.895 2 2 2h28c1.105 0 2-0.895 2-2v-18c0-1.104-0.895-2-2-2h-15z' />
      </svg>

      <svg viewBox='0 0 24 24' fill='none' className={fileClassName}>
        <path
          d='M9 12H15'
          stroke='#fff'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M9 15H15'
          stroke='#fff'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M17.8284 6.82843C18.4065 7.40649 18.6955 7.69552 18.8478 8.06306C19 8.4306 19 8.83935 19 9.65685L19 17C19 18.8856 19 19.8284 18.4142 20.4142C17.8284 21 16.8856 21 15 21H9C7.11438 21 6.17157 21 5.58579 20.4142C5 19.8284 5 18.8856 5 17L5 7C5 5.11438 5 4.17157 5.58579 3.58579C6.17157 3 7.11438 3 9 3H12.3431C13.1606 3 13.5694 3 13.9369 3.15224C14.3045 3.30448 14.5935 3.59351 15.1716 4.17157L17.8284 6.82843Z'
          stroke='#fff'
          strokeWidth='2'
          strokeLinejoin='round'
        />
      </svg>

      <div
        className='AssetOptionText'
        onClick={() => handleAssetSelection(assetOption)}
      >
        {assetOption}
        <Tooltip description={assetTooltipDescription} />
      </div>

      {subAssetOptions.map((subAssetOption: string) => {
        if (selectedAssetOptions.includes(assetOption)) {
          return (
            <SubAssetOption
              assetOption={assetOption}
              subAssetOption={subAssetOption}
              assetPath={assetPath}
              assets={assets}
              updateAssetOptions={updateAssetOptions}
              setSelectedAssetOptions={setSelectedAssetOptions}
              setSelectedScript={setSelectedScript}
              key={`action-${action.actionID}_asset-${subAssetOption}_subAsset-${subAssetOption}`}
            />
          )
        }
      })}
    </div>
  )
}
