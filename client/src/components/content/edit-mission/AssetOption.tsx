import { useState } from 'react'

import { AnyObject } from '../../../../../shared/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import './AssetOption.scss'
import SubAssetOption from './SubAssetOption'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { IScript } from '../../../../../shared/missions/actions'

export default function AssetOption(props: {
  action: ClientMissionAction
  assetOption: string
  assetPath: Array<string>
  assets: AnyObject
  updateAssetOptions: () => void
  setSelectedScript: (selectedScript: IScript) => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: ClientMissionAction = props.action
  let assetOption: string = props.assetOption
  let assetPath: Array<string> = props.assetPath
  let assets: AnyObject = props.assets
  let updateAssetOptions = props.updateAssetOptions
  let setSelectedScript = props.setSelectedScript
  let matchesIScriptProperties: boolean = false

  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const { forceUpdate } = globalContext.actions

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
      forceUpdate()
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
      assetTooltipDescription =
        `* File name: ${assetOption}\n` + `* Description: ${assets.description}`
    } else {
      assetTooltipDescription = assetOption
    }

    if (subAssetNames.length === 0) {
      indicatorClassName += ' Hidden'
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
  let assetOptionClassName: string = 'AssetOption'
  let assetOptionTextClassName: string = 'AssetOptionText'

  if (selectedAssetOptions.includes(assetOption)) {
    indicatorClassName += ' isExpanded'
  } else {
    indicatorClassName = 'Indicator'
  }

  if (assetOption === 'No assets here...') {
    folderClassName += ' Hidden'
    assetOptionClassName += ' NoAssetOption'
    assetOptionTextClassName += ' NoAssetOptionText'
  }

  checkForSubAssets()

  return (
    <div className={assetOptionClassName}>
      <svg
        className={indicatorClassName}
        onClick={() => toggleSubAssets(assetOption)}
      >
        <polygon points='3,7 10,7 6.5,14' className='Triangle' fill='#fff' />
      </svg>

      <div className={folderClassName}></div>

      <div className={fileClassName}></div>

      <div
        className={assetOptionTextClassName}
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
