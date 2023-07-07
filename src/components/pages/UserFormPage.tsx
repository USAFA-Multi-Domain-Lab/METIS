import { permittedRoles } from '../../modules/users'
import { IPage } from '../App'
import AppState, { AppActions } from '../AppState'

export interface IUserFormPage extends IPage {}

export default function UserFormPage(props: IUserFormPage): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  /* -- COMPONENT STATE -- */

  /* -- RENDER -- */
  if (
    appState.currentUser &&
    permittedRoles.includes(appState.currentUser.role)
  ) {
    return (
      <div className='UserFormPage'>
        <div className='UserFormPage-Title'>User Form Page</div>
      </div>
    )
  } else {
    return null
  }
}
