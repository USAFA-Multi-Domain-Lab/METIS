import React from 'react'
import './NodeHoverDisplay.scss'
import { useStore } from 'react-context-hook'
import { MissionNode } from '../../modules/missions'

const NodeHoverDisplay = (props: {
  selectedNode: MissionNode | null | undefined
}) => {
  /* -- GLOBAL STATE -- */
  const [processDelayTime] = useStore<number>('processDelayTime')
  const [nodeActionItemText] = useStore<string>('nodeActionItemText')

  let className = 'NodeHoverDisplay'

  if (
    typeof props.selectedNode?.successChance === 'number' &&
    typeof props.selectedNode?.selectedAction?.processTime === 'number' &&
    typeof props.selectedNode?.selectedAction.name === 'string'
  ) {
    className = 'NodeHoverDisplay'
  } else {
    className += ' hide'
  }

  return (
    <div className={className}>
      <div className='TimeToExecute'>
        Time to execute:{' '}
        {(props.selectedNode?.selectedAction?.processTime as number) / 1000}{' '}
        second(s)
      </div>
      <div className='ChosenNodeAction'>
        Node action selected:{' '}
        {props.selectedNode?.selectedAction?.name as string}
      </div>
      <div className='SuccessChance'>
        Chance of success: {(props.selectedNode?.successChance as number) * 100}
        %
      </div>
    </div>
  )
}

export default NodeHoverDisplay
