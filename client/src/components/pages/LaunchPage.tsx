import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import { DefaultLayout } from '.'
import Session from '../../../../shared/sessions'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import SessionConfig from '../content/session/SessionConfig'
import './LaunchPage.scss'

/**
 * Page responsible for launching a session with the given
 * configuration.
 */
export default function LaunchPage({
  missionId,
}: TLaunchPage_P): JSX.Element | null {
  /* -- state -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const { beginLoading, finishLoading, handleError, notify, navigateTo } =
    globalContext.actions
  const [mission, setMission] = useState<ClientMission>(
    new ClientMission({ _id: missionId }),
  )
  const [sessionConfig, setSessionConfig] = useState(Session.DEFAULT_CONFIG)

  /* -- effects -- */

  useMountHandler(async (done) => {
    // Handle the editing of an existing mission.
    if (missionId !== null) {
      try {
        // Notify user of loading.
        beginLoading('Loading mission...')
        // Load mission.
        let mission = await ClientMission.$fetchOne(missionId)
        // Store mission in the state.
        setMission(mission)
      } catch {
        handleError('Failed to load launch page.')
      }
    }

    // Finish loading.
    finishLoading()
    // Mark mount as handled.
    done()
  })

  /* -- computed -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext, { text: 'Cancel' })],
      boxShadow: 'alt-7',
    }),
  )

  /* -- functions -- */

  /**
   * Callback for saving the session configuration, which
   * launches the session.
   */
  const launch = async () => {
    if (server !== null) {
      try {
        // Notify user of session launch.
        beginLoading('Launching session...')
        // Launch session from mission ID.
        await SessionClient.$launch(mission._id, sessionConfig)
        // Navigate to home page.
        navigateTo('HomePage', {})
        // Notify user of success.
        notify('Successfully launched session.')
      } catch (error) {
        handleError({
          message: 'Failed to launch session. Contact system administrator.',
          notifyMethod: 'bubble',
        })
      }
    } else {
      handleError({
        message: 'No server connection. Contact system administrator',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Cancels the launch.
   */
  const cancel = () => {
    navigateTo('HomePage', {})
  }

  /* -- render -- */

  return (
    <div className='LaunchPage Page'>
      <DefaultLayout navigation={navigation}>
        <div className='MissionName'>{mission.name}</div>
        <SessionConfig
          sessionConfig={sessionConfig}
          saveButtonText={'Launch'}
          onSave={launch}
          onCancel={cancel}
        />
      </DefaultLayout>
    </div>
  )
}

/**
 * Props for `LaunchPage` component.
 */
export type TLaunchPage_P = {
  /**
   * The ID of the session to configure.
   */
  missionId: string
}
