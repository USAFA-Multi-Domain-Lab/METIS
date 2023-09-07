import { IScript } from 'metis/missions/actions'
import { AnyObject } from 'metis/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import './SubAssetOption.scss'

export default function SubAssetOption(props: {
  assetOption: string
  subAssetOption: string
  assetPath: Array<string>
  assets: AnyObject
  updateAssetOptions: () => void
  setSelectedScript: (selectedScript: IScript) => void
  setSelectedAssetOptions: (selectedAssetOptions: Array<string>) => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let assetOption: string = props.assetOption
  let subAssetOption: string = props.subAssetOption
  let assetPath: Array<string> = props.assetPath
  let assets: AnyObject = props.assets
  let updateAssetOptions = props.updateAssetOptions
  let setSelectedScript = props.setSelectedScript
  let setSelectedAssetOptions = props.setSelectedAssetOptions
  let matchesIScriptProperties: boolean = false

  /* -- COMPONENT STATE -- */
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
  const handleSubAssetSelection = (
    assetOption: string,
    subAssetOption: string,
  ) => {
    // Adds selected asset to the path for the user
    // to see.
    assetPath.push(assetOption)
    assetPath.push(subAssetOption)
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

  // Checks if the current assets have sub-asset options.
  // If so, the user interface is updated to display properly.
  const checkForSubAssets = () => {
    // Temporarily adds the current option to the asset path
    // to be able to go one layer deeper in the structure.
    assetPath.push(subAssetOption)

    // Goes to the next layer in the asset structure.
    updateCurrentLocation()

    // Grabs all the names of the sub-assets.
    let subAssetNames: Array<string> = Object.keys(assets)

    // Checks to see if this is the end of the structure.
    validateEndOfAssetPath(subAssetNames)

    if (matchesIScriptProperties) {
      subAssetTooltipDescription =
        `* File name: ${subAssetOption}\n` +
        `* Description: ${assets.description}`
    } else {
      subAssetTooltipDescription = subAssetOption
    }

    // Removes the asset that was added temporarily so that
    // the path can return to normal.
    assetPath.pop()
  }

  /* -- RENDER -- */

  // Default class names
  let subAssetTooltipDescription: string = ''

  checkForSubAssets()

  return (
    <div className='SubAssetOption'>
      <div
        className='SubAssetOptionText'
        onClick={() => handleSubAssetSelection(assetOption, subAssetOption)}
      >
        {subAssetOption}
        <Tooltip description={subAssetTooltipDescription} />
      </div>
    </div>
  )
}
