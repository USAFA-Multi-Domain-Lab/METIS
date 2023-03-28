import { MissionNodeAction } from '../../../modules/mission-node-actions'
import { AnyObject } from '../../../modules/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import NodeActionAsset from './NodeActionAsset'
import './NodeActionAssets.scss'

// This will render the list of assets
// that the user previously selected
export default function NodeActionAssets(props: {
  action: MissionNodeAction
  isEmptyString: boolean
  handleChange: () => void
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let action: MissionNodeAction = props.action
  let isEmptyString: boolean = props.isEmptyString
  let handleChange = props.handleChange

  /* -- COMPONENT FUNCTIONS -- */
  const removeAsset = (mechanismStateID: string) => {
    action.commandScripts.splice(
      action.commandScripts.indexOf(mechanismStateID),
      1,
    )
    handleChange()
  }

  /* -- RENDER -- */

  // Default class names
  let removeAssetButtonClassName: string = 'RemoveAssetButton'

  // if a field is left empty on the node
  // level or the action level then
  // the removeAsset button is disabled.
  if (isEmptyString) {
    removeAssetButtonClassName += ' Disabled'
  }

  if (action.commandScripts.length > 0) {
    return (
      <div className='Assets'>
        <h5 className='AssetInfo'>Asset(s):</h5>
        <div className='AssetListTitle'>Assets that will be affected:</div>
        <div className='SelectedAssetListContainer'>
          {action.commandScripts.map(
            (commandScripts: string, index: number) => {
              return (
                <div
                  className='SelectedAssetList'
                  key={`action-${action.actionID}_commandScript-${commandScripts}_index-${index}`}
                >
                  <div className='SelectedAsset'>{commandScripts} </div>
                  <div
                    className={removeAssetButtonClassName}
                    onClick={() => removeAsset(commandScripts)}
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
          isEmptyString={isEmptyString}
          handleChange={handleChange}
        />
      </div>
    )
  } else if (action.commandScripts.length === 0) {
    return (
      <div className='Assets'>
        <NodeActionAsset
          action={action}
          isEmptyString={isEmptyString}
          handleChange={handleChange}
        />
      </div>
    )
  } else {
    return null
  }
}
