import { useStore } from 'react-context-hook'
import { IPage } from '../App'
import AppState, { AppActions } from '../AppState'
import './ServerErrorPage.scss'

export interface IServerErrorPage extends IPage {}

// This will render a page that displays a server
// error that has occured.
export default function ServerErrorPage(
  props: IServerErrorPage,
): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  return (
    <div className='ServerErrorPage Page'>
      <div className='ErrorMessage'>{appState.errorMessage}</div>
      <a className='Refresh' href='/'>
        Refresh.
      </a>
    </div>
  )
}
