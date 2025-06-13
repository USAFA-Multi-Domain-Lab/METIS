import { useGlobalContext } from 'src/context/global'
import { TPage_P } from '.'
import './LoadingPage.scss'

export interface ILoadingPage extends TPage_P {}

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
