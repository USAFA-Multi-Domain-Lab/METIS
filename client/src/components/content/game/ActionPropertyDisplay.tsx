import ClientMissionAction from 'src/missions/actions'
import './ActionPropertyDisplay.scss'

const ActionPropertyDisplay = (props: { action: ClientMissionAction }) => {
  let { action } = props

  return (
    <ul className='ActionPropertyDisplay'>
      <li className='ChosenNodeAction'>
        <span>Action selected:</span> {action.name as string}
      </li>
      <li className='TimeToExecute'>
        <span>Time to execute:</span> {(action.processTime as number) / 1000}{' '}
        second(s)
      </li>
      <li className='SuccessChance'>
        <span>Chance of success:</span> {(action.successChance as number) * 100}
        %
      </li>
      <li className='ResourceCost'>
        <span>Resource cost:</span> {action.resourceCost} resource(s)
      </li>
      <li className='Description'>
        <span>Description:</span> {action.description}
      </li>
    </ul>
  )
}

export default ActionPropertyDisplay
