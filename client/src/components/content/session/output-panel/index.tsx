import { useState } from 'react'
import ClientMissionForce from 'src/missions/forces'
import { useEventListener } from 'src/toolbox/hooks'
import Custom from './Custom'
import ExecutionDone from './ExecutionDone'
import ExecutionStarted from './ExecutionStarted'
import './index.scss'
import Intro from './Intro'
import PreExecution from './PreExecution'

/**
 * A panel for displaying messages in the session.
 */
export default function OutputPanel({ force }: TOutputPanel_P): JSX.Element {
  /* -- STATE -- */
  const [outputs, setOutputs] = useState<ClientMissionForce['outputs']>(
    force.outputs,
  )

  /* -- EFFECTS -- */

  // Listen for new outputs.
  useEventListener(force, 'output', () => {
    setOutputs([...force.outputs])
  })

  /* -- RENDER -- */
  return (
    <div className='OutputPanel'>
      <div className='BorderBox'>
        {outputs.map((output) => {
          switch (output.type) {
            case 'intro':
              return (
                <Intro
                  output={output}
                  key={`output-${output._id}_type-${output.type}_time-${output.time}`}
                />
              )
            case 'pre-execution':
              return (
                <PreExecution
                  output={output}
                  key={`output-${output._id}_type-${output.type}_time-${output.time}`}
                />
              )
            case 'execution-started':
              return (
                <ExecutionStarted
                  output={output}
                  key={`output-${output._id}_type-${output.type}_time-${output.time}`}
                />
              )
            case 'execution-succeeded':
              return (
                <ExecutionDone
                  output={output}
                  key={`output-${output._id}_type-${output.type}_time-${output.time}`}
                />
              )
            case 'execution-failed':
              return (
                <ExecutionDone
                  output={output}
                  key={`output-${output._id}_type-${output.type}_time-${output.time}`}
                />
              )
            case 'custom':
              return (
                <Custom
                  output={output}
                  key={`output-${output._id}_type-${output.type}_time-${output.time}`}
                />
              )
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR OUTPUT PANEL ---------------------------- */

/**
 * Prop type for `OutputPanel`.
 */
type TOutputPanel_P = {
  /**
   * The force to render the message(s) for.
   */
  force: ClientMissionForce
}
