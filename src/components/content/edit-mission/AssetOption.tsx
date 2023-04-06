import { useState } from 'react'
import { useStore } from 'react-context-hook'
import {
  MissionNodeAction,
  IScript,
} from '../../../modules/mission-node-actions'
import { AnyObject } from '../../../modules/toolbox/objects'
import './AssetOption.scss'

export default function AssetOption(props: {
  action: MissionNodeAction
  assetOption: string
  assetPath: Array<string>
  assets: AnyObject
  iScriptProperties: IScript
  updateAssetOptions: () => void
  setSelectedScript: (selectedScript: IScript) => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let assetOption: string = props.assetOption
  let assetPath: Array<string> = props.assetPath
  let assets: AnyObject = props.assets
  let iScriptProperties: IScript = props.iScriptProperties
  let updateAssetOptions = props.updateAssetOptions
  let setSelectedScript = props.setSelectedScript

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

  const updateCurrentLocation = () => {
    // Updates the structure, or path, based on
    // which assets are selected.
    for (let asset of assetPath) {
      if (assets[asset] !== undefined) {
        assets = assets[asset]
      }
    }
  }

  // Called when a user selects an asset. Works similar
  // to a file explorer.
  const handleAssetSelection = (assetOption: string) => {
    // Adds selected asset to the path for the user
    // to see.
    assetPath.push(assetOption)

    if (assets.label && assets.scriptName && assets.args) {
      let script: any = assets
      setSelectedScript(script)
    }

    setSelectedAssetOptions([])
    updateCurrentLocation()
    updateAssetOptions()
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
    updateCurrentLocation()
    updateAssetOptions()
  }

  const toggleSubAssets = (selectedOption: string) => {
    assetPath.push(selectedOption)

    updateCurrentLocation()

    let subAssets: Array<string> = Object.keys(assets)

    if (
      !selectedAssetOptions.includes(selectedOption) &&
      !subAssets.includes(iScriptProperties.label) &&
      !subAssets.includes(iScriptProperties.scriptName) &&
      !subAssets.includes(iScriptProperties.args[0])
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

    updateCurrentLocation()

    let subAssets: Array<string> = Object.keys(assets)

    if (
      subAssets.includes(iScriptProperties.label) &&
      subAssets.includes(iScriptProperties.scriptName) &&
      subAssets.includes(iScriptProperties.args[0])
    ) {
      // Hides the triangle if there are
      // no options after what the user
      // can currently see
      indicatorClassName += ' Hidden'
      folderClassName += ' Hidden'
      fileClassName = 'File'
    }

    assetPath.pop()
  }

  /* -- RENDER -- */
  // Default class names
  let indicatorClassName: string = 'Indicator'
  let folderClassName: string = 'Folder'
  let fileClassName: string = 'Hidden'

  if (selectedAssetOptions.includes(assetOption)) {
    indicatorClassName += ' isExpanded'
  } else {
    indicatorClassName = 'Indicator'
  }

  // Checks if an asset option has a sub-asset option
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
      </div>

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
