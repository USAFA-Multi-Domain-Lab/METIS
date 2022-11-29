import './ActionPropertyDisplay.scss'
import { MissionNode } from '../../modules/mission-nodes'

const ActionPropertyDisplay = (props: {
  selectedNode: MissionNode | null | undefined
}) => {
  let selectedAction = props.selectedNode?.selectedAction

  return (
    <div className='ActionPropertyDisplay'>
      <div className='TimeToExecute'>
        Time to execute: {(selectedAction?.processTime as number) / 1000}{' '}
        second(s)
      </div>
      <div className='ChosenNodeAction'>
        Action selected: {selectedAction?.name as string}
      </div>
      <div className='SuccessChance'>
        Chance of success: {(props.selectedNode?.successChance as number) * 100}
        %
      </div>
      <div className='ResourceCost'>
        Resource cost: {selectedAction?.resourceCost} resource(s)
      </div>
      <div className='Description'>
        Description: {selectedAction?.description}
      </div>
    </div>
  )
}

export default ActionPropertyDisplay
