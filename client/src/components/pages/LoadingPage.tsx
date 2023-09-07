import './LoadingPage.scss'
import { IPage } from '../App'
import { useGlobalContext } from 'metis/client/context'

export interface ILoadingPage extends IPage {}

// This will render a loading page while the app
// is loading.
export default function LoadingPage(props: ILoadingPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const [loadingMessage] = globalContext.loadingMessage

  /* -- RENDER -- */

  return (
    <div className={'LoadingPage Page'}>
      <div className='Message'>{loadingMessage}</div>
    </div>
  )
}
