import GlobalContext from 'metis/client/context/global'
import { TEffectType } from 'metis/missions'
import ReactDOM from 'react-dom/client'
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
import ClientMissionFile from './missions/files'
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
export type TMetisClientComponents = {
  session: SessionClient
  member: ClientSessionMember
  user: ClientUser
  targetEnv: ClientTargetEnvironment
  target: ClientTarget
  fileReference: ClientFileReference
  mission: ClientMission
  prototype: ClientMissionPrototype
  missionFile: ClientMissionFile
  force: ClientMissionForce
  output: ClientOutput
  node: ClientMissionNode
  action: ClientMissionAction
  execution: ClientActionExecution
  outcome: ClientExecutionOutcome
} & {
  [TType in TEffectType]: ClientEffect<TType>
}
