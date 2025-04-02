import ReactDOM from 'react-dom/client'
import GlobalContext from 'src/context'
import { TMetisBaseComponents } from '../../shared'
import App from './components/App'
import ErrorPage from './components/pages/ErrorPage'
import ClientFileReference from './files/references'
import './global.d.ts'
import './index.scss'
import ClientMission from './missions'
import ClientMissionAction from './missions/actions'
import ClientActionExecution from './missions/actions/executions'
import ClientExecutionOutcome from './missions/actions/outcomes'
import { ClientEffect } from './missions/effects'
import ClientMissionForce from './missions/forces'
import ClientOutput from './missions/forces/outputs'
import ClientMissionNode from './missions/nodes'
import ClientMissionPrototype from './missions/nodes/prototypes'
import SessionClient from './sessions'
import ClientSessionMember from './sessions/members'
import { ClientTargetEnvironment } from './target-environments'
import ClientTarget from './target-environments/targets'
import ClientUser from './users'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error caught:', {
    message,
    source,
    lineno,
    colno,
    error,
  })

  root.render(<ErrorPage />)
}

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason)

  root.render(<ErrorPage />)
}

root.render(
  <GlobalContext.Provider>
    <App />
  </GlobalContext.Provider>,
)

declare global {
  type TTest = 'string'
}

/**
 * Client registry of METIS components types.
 * @note This is used for all client-side METIS
 * component classes.
 */
export interface TMetisClientComponents extends TMetisBaseComponents {
  session: SessionClient
  member: ClientSessionMember
  user: ClientUser
  targetEnv: ClientTargetEnvironment
  target: ClientTarget
  mission: ClientMission
  force: ClientMissionForce
  output: ClientOutput
  prototype: ClientMissionPrototype
  node: ClientMissionNode
  action: ClientMissionAction
  execution: ClientActionExecution
  outcome: ClientExecutionOutcome
  effect: ClientEffect
  fileReference: ClientFileReference
}
