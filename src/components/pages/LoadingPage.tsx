import './LoadingPage.scss'
import { useStore } from 'react-context-hook'

// This will render a loading page while the app
// is loading.
export default function LoadingPage(): JSX.Element | null {
  // -- GLOBAL STATE --

  const [loadingMessage] = useStore<string | null>('loadingMessage')
  const [errorMessage] = useStore<string | null>('errorMessage')
  const [lastLoadingMessage] = useStore<string | null>('lastLoadingMessage')
  const [loadingMinTimeReached] = useStore<boolean>('loadingMinTimeReached')

  // -- RENDER --

  let isLoading: boolean =
    (loadingMessage !== null && errorMessage === null) || !loadingMinTimeReached

  let className = 'LoadingPage'

  if (isLoading) {
    className += ' visible'
  } else {
    className += ' invisible'
  }

  return (
    <div className={className}>
      <div className='Message'>{lastLoadingMessage}</div>
    </div>
  )
}
