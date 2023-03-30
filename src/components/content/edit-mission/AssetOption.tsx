import { useState } from 'react'
import { useStore } from 'react-context-hook'
import MissionNodeAction from '../../../modules/mission-node-actions'
import { AnyObject } from '../../../modules/toolbox/objects'
import './AssetOption.scss'

export default function AssetSubAsset(props: {
  action: MissionNodeAction
  assetOption: string
  assetPath: Array<string>
  assets: AnyObject
  assetOptions: Array<string>
  updateCurrentAssetStructureLocation: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let assetOption: string = props.assetOption
  let assetPath: Array<string> = props.assetPath
  let assets: AnyObject = props.assets
  let assetOptions: Array<string> = props.assetOptions
  let updateCurrentAssetStructureLocation =
    props.updateCurrentAssetStructureLocation

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

  // Called when a user selects an asset. Works similar
  // to a file explorer.
  const handleAssetSelection = (assetOption: string) => {
    // Adds selected asset to the path for the user
    // to see.
    assetPath.push(assetOption)

    setSelectedAssetOptions([])

    updateCurrentAssetStructureLocation()
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

    setSelectedAssetOptions([])

    updateCurrentAssetStructureLocation()
  }

  const toggleSubAssets = (selectedOption: string) => {
    assetPath.push(selectedOption)

    // Updates the structure, or path, based on
    // which assets are selected.
    for (let asset of assetPath) {
      if (assets[asset] !== undefined) {
        assets = assets[asset]
      }
    }

    let subAssets: Array<string> = Object.keys(assets)

    if (
      !selectedAssetOptions.includes(selectedOption) &&
      !subAssets.includes('0')
    ) {
      selectedAssetOptions.push(selectedOption)
      setSubAssetOptions(subAssets)
    } else {
      selectedAssetOptions.splice(
        selectedAssetOptions.indexOf(selectedOption),
        1,
      )
      setForcedUpdateCounter(forcedUpdateCounter + 1)
    }

    assetPath.pop()
  }

  const checkForSubAssets = () => {
    assetPath.push(assetOption)

    // Updates the structure, or path, based on
    // which assets are selected.
    for (let asset of assetPath) {
      if (assets[asset] !== undefined) {
        assets = assets[asset]
      }
    }

    let subAssets: Array<string> = Object.keys(assets)

    // Hides the triangle if there are
    // no options after what the user
    // can currently see
    if (subAssets.includes('0')) {
      indicatorClassName += ' Hidden'
    }

    assetPath.pop()
  }

  /* -- RENDER -- */
  // Default class names
  let indicatorClassName: string = 'Indicator'

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
      <span
        className='AssetOptionText'
        onClick={() => handleAssetSelection(assetOption)}
      >
        {assetOption}
      </span>

      {subAssetOptions.map((subAssetOption: string) => {
        if (selectedAssetOptions.includes(assetOption)) {
          return (
            <div
              className='SubAssetOption'
              key={`action-${action.actionID}_asset-${assetOption}_subAsset-${subAssetOption}`}
            >
              <span
                className='SubAssetOptionText'
                onClick={() =>
                  handleSubAssetSelection(assetOption, subAssetOption)
                }
              >
                {subAssetOption}
              </span>
            </div>
          )
        }
      })}
    </div>
  )
}
