import { Mission } from '../../modules/missions'
import { AnyObject } from '../../modules/toolbox/objects'
import AppState, { AppActions } from '../AppState'
import Branding from './Branding'
import './Navigation.scss'

const Navigation = (props: {
  appState: AppState
  appActions: AppActions
  mission: Mission | null
  pagePath: string
  pageProps: AnyObject
  brandingCallback: (() => void) | null
  brandingTooltipDescription: string | null
}): JSX.Element => {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions
  let mission = props.mission
  let pagePath: string = props.pagePath
  let pageProps: AnyObject = props.pageProps

  /* -- COMPONENT FUNCTIONS -- */

  // This will logout the current user.
  const logout = () => {
    appActions.logout({
      returningPagePath: pagePath,
      returningPageProps: pageProps,
    })
  }

  // This will switch to the login page.
  const login = () => {
    if (mission !== null) {
      appActions.goToPage('AuthPage', {
        returningPagePath: pagePath,
        returningPageProps: pageProps,
      })
    } else {
      appActions.goToPage('AuthPage', {
        returningPagePath: pagePath,
        returningPageProps: pageProps,
      })
    }
  }

  // Keeps track of if the user is logged in or not.
  // If the user is not logged in then the sign out button will not display.
  // If the user is logged in then the "Login" button will change to "Edit Mission"
  // and the "Sign Out" button will appear.
  let navClassName: string = 'Navigation'

  if (appState.currentUser !== null) {
    navClassName += ' SignOut'
  }

  return (
    <div className={navClassName}>
      <Branding
        goHome={props.brandingCallback}
        tooltipDescription={props.brandingTooltipDescription}
      />
      {/* <Branding goHome={null} tooltipDescription={null} /> */}
      <div
        className='Home Link'
        onClick={() => appActions.goToPage('MissionSelectionPage', {})}
      >
        Back to selection
      </div>

      <div className='Login Link' onClick={login}>
        Login
      </div>
      <div className='Logout Link' onClick={logout}>
        Sign out
      </div>
    </div>
  )
}

export default Navigation
