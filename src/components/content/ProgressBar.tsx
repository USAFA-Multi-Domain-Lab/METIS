import './ProgressBar.scss'
import { useStore } from 'react-context-hook'

// This will render a progress bar after the node action is executed
const ProgressBar = () => {
  // -- GLOBAL STATE --

  const [loadingMessage] = useStore<string | null>('loadingMessage')
  const [errorMessage] = useStore<string | null>('errorMessage')
  const [loadingMinTimeReached] = useStore<boolean>('loadingMinTimeReached')
  const [outputDelayTime] = useStore<number>('outputDelayTime')

  // -- RENDER --

  let isLoading: boolean =
    (loadingMessage !== null && errorMessage === null) || !loadingMinTimeReached

  let className = 'ProgressBar'

  if (isLoading === false) {
    className += ' hidden'
  }

  return (
    <div className={className}>
      <div className='ProgressMessage'>Processing command</div>
      <div className='Progress'></div>
    </div>
  )
}

export default ProgressBar
