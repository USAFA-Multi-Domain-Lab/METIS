import './LoadingPage.scss'
import { useStore } from 'react-context-hook'
import { IPage } from '../App'
import AppState, { AppActions } from '../AppState'

export interface ILoadingPage extends IPage {}

// This will render a loading page while the app
// is loading.
export default function LoadingPage(props: ILoadingPage): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  // -- RENDER --

  return (
    <div className={'LoadingPage Page'}>
      <div className='Message'>{appState.loadingMessage}</div>
    </div>
  )
}
