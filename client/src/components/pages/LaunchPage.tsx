import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission, { TMissionComponent } from 'src/missions'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import { useMountHandler, useRequireLogin } from 'src/toolbox/hooks'
import { DefaultLayout } from '.'

import Session from '../../../../shared/sessions'
import { SingleTypeObject } from '../../../../shared/toolbox/objects'
import { ESortByMethod } from '../content/general-layout/ListOld'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import SessionConfig from '../content/session/SessionConfig'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../content/user-controls/buttons/ButtonSvgPanel'
import './LaunchPage.scss'

/**
 * Page responsible for launching a session with the given
 * configuration.
 */
export default function LaunchPage({
  missionId,
}: TLaunchPage_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    navigateTo,
    prompt,
  } = globalContext.actions

  /* -- STATE -- */
  const [mission, setMission] = useState<ClientMission>(
    new ClientMission({ _id: missionId }),
  )
  const [sessionConfig] = useState(Session.DEFAULT_CONFIG)

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const [login] = useRequireLogin()

  // Grab the user currently logged in.
  let { user: currentUser } = login

  /* -- EFFECTS -- */

  const [mountHandled] = useMountHandler(async (done) => {
    // Make sure the user has access to the page.
    if (!currentUser.isAuthorized('sessions_write')) {
      handleError(
        'You do not have access to this page. Please contact an administrator.',
      )
      return done()
    }

    // Handle the editing of an existing mission.
    if (missionId !== null) {
      try {
        // Notify user of loading.
        beginLoading('Loading mission...')
        // Load mission.
        let mission = await ClientMission.$fetchOne(missionId, {
          populateTargets: true,
        })
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

  /* -- COMPUTED -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext, { text: 'Cancel' })],
      boxShadow: 'alt-7',
    }),
  )

  /* -- FUNCTIONS -- */
  /**
   * Renders JSX for the effect list item.
   */
  const renderObjectListItem = (object: TMissionComponent) => {
    /* -- COMPUTED -- */

    /**
     * The buttons for the object list.
     */
    const buttons: TValidPanelButton[] = compute(() => {
      // Create a default list of buttons.
      let buttons: TValidPanelButton[] = []
      // Create a list of mini actions that are available.
      let availableMiniActions: SingleTypeObject<TValidPanelButton> = {
        warning: {
          type: 'warning-transparent',
          key: 'warning',
          onClick: () => {},
          cursor: 'help',
          description:
            'If this conflict is not resolved, this mission can still be used to launch a session, but the session may not function as expected.',
        },
      }

      // Add the buttons to the list.
      buttons = Object.values(availableMiniActions)

      // Return the buttons.
      return buttons
    })

    return (
      <div className='Row' key={`object-row-${object._id}`}>
        <ButtonSvgPanel buttons={buttons} size={'small'} />
        <div className='RowContent'>{object.defectiveMessage}</div>
      </div>
    )
  }

  /**
   * Callback for saving the session configuration, which
   * launches the session.
   */
  const launch = async () => {
    if (server !== null) {
      try {
        // If there are invalid objects and effects are enabled...
        if (
          sessionConfig.effectsEnabled &&
          mission.defectiveObjects.length > 0
        ) {
          // Create a message for the user.
          let message =
            `**Warning:** The mission for this session is defective due to unresolved conflicts. If you proceed, the session may not function as expected.\n` +
            `**What would you like to do?**`
          // Create a list of choices for the user.
          let choices: string[] = []

          // Generate choices based on the user's permissions.
          if (currentUser.isAuthorized(['missions_write', 'sessions_write'])) {
            choices = ['Edit Mission', 'Launch Anyway', 'Cancel']
          } else if (currentUser.isAuthorized('sessions_write')) {
            choices = ['Launch Anyway', 'Cancel']
          } else {
            choices = ['Cancel']
          }

          // Prompt the user for a choice.
          let { choice } = await prompt(message, choices, {
            list: {
              items: mission.defectiveObjects,
              headingText: 'Unresolved Conflicts',
              sortByMethods: [ESortByMethod.Name],
              searchableProperties: ['name'],
              renderObjectListItem: renderObjectListItem,
            },
          })
          // If the user cancels then cancel the launch.
          if (choice === 'Cancel') return
          // If the user chooses to edit the mission then navigate to the mission page.
          if (choice === 'Edit Mission') {
            navigateTo('MissionPage', { missionId: mission._id })
          }
          // If the user chooses to launch anyway then launch the session.
          if (choice === 'Launch Anyway') {
            // Notify user of session launch.
            beginLoading('Launching session...')
            // Launch session from mission ID.
            await SessionClient.$launch(mission._id, sessionConfig)
            // Navigate to home page.
            navigateTo('HomePage', {})
            // Notify user of success.
            notify('Successfully launched session.')
          }
        } else {
          // Notify user of session launch.
          beginLoading('Launching session...')
          // Launch session from mission ID.
          await SessionClient.$launch(mission._id, sessionConfig)
          // Navigate to home page.
          navigateTo('HomePage', {})
          // Notify user of success.
          notify('Successfully launched session.')
        }
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

  /* -- RENDER -- */

  if (mountHandled) {
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
  } else {
    return null
  }
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
