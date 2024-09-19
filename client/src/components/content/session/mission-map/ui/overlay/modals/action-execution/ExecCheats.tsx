import { useEffect, useState } from 'react'
import { DetailToggle } from 'src/components/content/form/DetailToggle'
import { TExecutionCheats } from '../../../../../../../../../../shared/missions/actions/executions'
import './ExecCheats.scss'

/* -- COMPONENT -- */

/**
 * Displays options for enabling various cheats when
 * executing an action.
 */
export default function ExecCheats({
  cheats,
  setCheats,
}: TExecCheats_P): JSX.Element | null {
  /* -- STATE -- */

  const [zeroCost, setZeroCost] = useState<boolean>(cheats.zeroCost)
  const [instantaneous, setInstantaneous] = useState<boolean>(
    cheats.instantaneous,
  )
  const [guaranteedSuccess, setGuaranteedSuccess] = useState<boolean>(
    cheats.guaranteedSuccess,
  )

  /* -- COMPUTED -- */

  /* -- EFFECTS -- */

  // Updates parent `cheats` state passed in props
  // whenever any of the cheats are toggled.
  useEffect(() => {
    setCheats({
      zeroCost,
      instantaneous,
      guaranteedSuccess,
    })
  }, [zeroCost, instantaneous, guaranteedSuccess])

  /* -- RENDER -- */

  return (
    <div className='ExecCheats'>
      <div className='Heading'>Cheats:</div>
      <DetailToggle
        label='Zero Resource Cost:'
        stateValue={zeroCost}
        setState={setZeroCost}
      />
      <DetailToggle
        label='Instantaneous Execution:'
        stateValue={instantaneous}
        setState={setInstantaneous}
      />
      <DetailToggle
        label='Guaranteed Success:'
        stateValue={guaranteedSuccess}
        setState={setGuaranteedSuccess}
      />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for `ExecCheats`.
 */
export type TExecCheats_P = {
  /**
   * The state for the cheats.
   */
  cheats: TExecutionCheats
  /**
   * Sets the state for the cheats.
   */
  setCheats: TReactSetter<TExecutionCheats>
}
