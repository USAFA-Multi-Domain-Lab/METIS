import App from '@client/components/App'
import ErrorPage from '@client/components/pages/ErrorPage'
import GlobalContext from '@client/context/global'
import type { ClientFileReference } from '@client/files/ClientFileReference'
import type { ClientMission } from '@client/missions/ClientMission'
import type { ClientActionExecution } from '@client/missions/actions/ClientActionExecution'
import type { ClientExecutionOutcome } from '@client/missions/actions/ClientExecutionOutcome'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import type { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import type { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import type { ClientOutput } from '@client/missions/forces/ClientOutput'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type { ClientMissionPrototype } from '@client/missions/nodes/ClientMissionPrototype'
import type { ClientSessionMember } from '@client/sessions/ClientSessionMember'
import type { SessionClient } from '@client/sessions/SessionClient'
import type { ClientTarget } from '@client/target-environments/ClientTarget'
import type { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import type { ClientUser } from '@client/users/ClientUser'
import type { TEffectType } from '@shared/missions/effects/Effect'
import ReactDOM from 'react-dom/client'
import './index.scss'

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
