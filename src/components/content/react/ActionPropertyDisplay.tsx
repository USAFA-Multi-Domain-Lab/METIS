import '../sass/ActionPropertyDisplay.scss'
import { MissionNode } from '../../../modules/mission-nodes'

const ActionPropertyDisplay = (props: {
  selectedNode: MissionNode | null | undefined
}) => {
  let selectedAction = props.selectedNode?.selectedAction

  return (
    <ul className='ActionPropertyDisplay'>
      <li className='ChosenNodeAction'>
        <span>Action selected:</span> {selectedAction?.name as string}
      </li>
      <li className='TimeToExecute'>
        <span>Time to execute:</span>{' '}
        {(selectedAction?.processTime as number) / 1000} second(s)
      </li>
      <li className='SuccessChance'>
        <span>Chance of success:</span>{' '}
        {(props.selectedNode?.selectedAction?.successChance as number) * 100}%
      </li>
      <li className='ResourceCost'>
        <span>Resource cost:</span> {selectedAction?.resourceCost} resource(s)
      </li>
      <li className='Description'>
        <span>Description:</span> {selectedAction?.description}
      </li>
    </ul>
  )
}

export default ActionPropertyDisplay
