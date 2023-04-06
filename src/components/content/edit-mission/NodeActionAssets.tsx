import {
  IScript,
  MissionNodeAction,
} from '../../../modules/mission-node-actions'
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

  let iScriptProperties: IScript = {
    label: 'label',
    scriptName: 'scriptName',
    args: ['args'],
  }

  /* -- COMPONENT FUNCTIONS -- */
  const removeAsset = (script: IScript) => {
    action.scripts.splice(action.scripts.indexOf(script), 1)
    handleChange()
  }

  /* -- RENDER -- */

  // Default class names
  let removeAssetButtonClassName: string = 'CloseButton'

  // if a field is left empty on the node
  // level or the action level then
  // the removeAsset button is disabled.
  if (isEmptyString) {
    removeAssetButtonClassName += ' Disabled'
  }

  if (action.scripts.length > 0) {
    return (
      <div className='Assets'>
        <h5 className='AssetInfo'>Asset(s):</h5>
        <div className='AssetListTitle'>Assets that will be affected:</div>
        <div className='SelectedAssetListContainer'>
          {action.scripts.map((script: IScript, index: number) => {
            return (
              <div
                className='SelectedAssetList'
                key={`action-${action.actionID}_commandScript-${script}_index-${index}`}
              >
                <div className='SelectedAsset'>
                  {script.scriptName}("{script.label}"){' '}
                </div>
                <div className='Close'>
                  <div
                    className={removeAssetButtonClassName}
                    onClick={() => removeAsset(script)}
                  >
                    x
                    <Tooltip description='Remove asset.' />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <NodeActionAsset
          action={action}
          isEmptyString={isEmptyString}
          iScriptProperties={iScriptProperties}
          handleChange={handleChange}
        />
      </div>
    )
  } else if (action.scripts.length === 0) {
    return (
      <div className='Assets'>
        <NodeActionAsset
          action={action}
          isEmptyString={isEmptyString}
          iScriptProperties={iScriptProperties}
          handleChange={handleChange}
        />
      </div>
    )
  } else {
    return null
  }
}
