import './ActionPropertyDisplay.scss'
import { MissionNode } from '../../modules/missions'

const ActionPropertyDisplay = (props: {
  selectedNode: MissionNode | null | undefined
}) => {
  let selectedAction = props.selectedNode?.selectedNodeAction

  return (
    <div className='ActionPropertyDisplay'>
      <div className='TimeToExecute'>
        Time to execute: {(selectedAction?.timeDelay as number) / 1000}{' '}
        second(s)
      </div>
      <div className='ChosenNodeAction'>
        Node action selected: {selectedAction?.text as string}
      </div>
      <div className='SuccessChance'>
        Chance of success: {(props.selectedNode?.successChance as number) * 100}
        %
      </div>
      <div className='Description'>
        Description: {selectedAction?.description}
      </div>
    </div>
  )
}

export default ActionPropertyDisplay
