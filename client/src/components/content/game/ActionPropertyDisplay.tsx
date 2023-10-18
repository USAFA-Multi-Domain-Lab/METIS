import ClientMissionAction from 'src/missions/actions'
import './ActionPropertyDisplay.scss'
import RichTextOutputBox from 'src/components/content/communication/RichTextOutputBox'

const ActionPropertyDisplay = (props: { action: ClientMissionAction }) => {
  let { action } = props

  return (
    <ul className='ActionPropertyDisplay'>
      <li className='ActionProperty ChosenNodeAction'>
        Action selected: {action.name}
      </li>
      <li className='ActionProperty TimeToExecute'>
        Time to execute: {action.processTime / 1000} second(s)
      </li>
      <li className='ActionProperty SuccessChance'>
        Chance of success: {action.successChance * 100}%
      </li>
      <li className='ActionProperty ResourceCost'>
        Resource cost: {action.resourceCost} resource(s)
      </li>
      <li className='ActionProperty Description'>
        <span>Description: </span>
        <RichTextOutputBox Element={action.description} />
      </li>
    </ul>
  )
}

export default ActionPropertyDisplay
