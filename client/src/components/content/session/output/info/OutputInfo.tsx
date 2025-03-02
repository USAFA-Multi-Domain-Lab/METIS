import NodeLocation from './NodeLocation'
import { useOutputContext } from '../Output'

/**
 * Renders the line of output in the output panel that indicates
 * general information about the output, including when it was
 * generated and where it came from.
 */
export default function () {
  const {
    output: { timeStamp, prefix },
  } = useOutputContext()

  return (
    <span className='OutputInfo'>
      <NodeLocation /> [{timeStamp}] {prefix}{' '}
    </span>
  )
}
