import { useStore } from 'react-context-hook'
import './ServerErrorPage.scss'

// This will render a page that displays a server
// error that has occured.
export default function ServerErrorPage(): JSX.Element | null {
  // -- GLOBAL STATE --

  const [errorMessage, setErrorMessage] = useStore<string | null>(
    'errorMessage',
  )
  const [loadingMinTimeReached] = useStore<boolean>('loadingMinTimeReached')

  if (errorMessage !== null && loadingMinTimeReached) {
    return (
      <div className='ServerErrorPage'>
        <div className='ErrorMessage'>{errorMessage}</div>
        <a className='Refresh' href='/'>
          Refresh.
        </a>
      </div>
    )
  } else {
    return null
  }
}
