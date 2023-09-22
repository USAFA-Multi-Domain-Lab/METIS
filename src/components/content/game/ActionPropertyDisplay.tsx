import './ActionPropertyDisplay.scss'
import { MissionNode } from '../../../modules/mission-nodes'
import RichTextOutputBox from '../communication/RichTextOutputBox'

const ActionPropertyDisplay = (props: {
  selectedNode: MissionNode | null | undefined
}) => {
  let selectedAction = props.selectedNode?.selectedAction

  if (selectedAction) {
    return (
      <ul className='ActionPropertyDisplay'>
        <li className='ActionProperty ChosenNodeAction'>
          Action selected: {selectedAction.name}
        </li>
        <li className='ActionProperty TimeToExecute'>
          Time to execute: {selectedAction.processTime / 1000} second(s)
        </li>
        <li className='ActionProperty SuccessChance'>
          Chance of success: {selectedAction.successChance * 100}%
        </li>
        <li className='ActionProperty ResourceCost'>
          Resource cost: {selectedAction.resourceCost} resource(s)
        </li>
        <li className='ActionProperty Description'>
          <span>Description: </span>
          <RichTextOutputBox Element={selectedAction.description} />
        </li>
      </ul>
    )
  } else {
    return (
      <ul className='ActionPropertyDisplay'>
        <li className='ChosenNodeAction'>Action selected: None</li>
        <li className='TimeToExecute'>Time to execute: None</li>
        <li className='SuccessChance'>Chance of success: None</li>
        <li className='ResourceCost'>Resource cost: None</li>
        <li className='Description'>Description: None</li>
      </ul>
    )
  }
}

export default ActionPropertyDisplay
