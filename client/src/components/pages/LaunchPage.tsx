import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission, { TMissionDefectiveObject } from 'src/missions'
import { ClientEffect } from 'src/missions/effects'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import { DefaultLayout } from '.'

import Session from '../../../../shared/sessions'
import { SingleTypeObject } from '../../../../shared/toolbox/objects'
import { ESortByMethod } from '../content/general-layout/List'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import SessionConfig from '../content/session/SessionConfig'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../content/user-controls/ButtonSvgPanel'
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

  /* -- EFFECTS -- */

  const [mountHandled] = useMountHandler(async (done) => {
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
  const renderObjectListItem = (object: TMissionDefectiveObject) => {
    /* -- COMPUTED -- */

    /**
     * The buttons for the object list.
     */
    const buttons = compute(() => {
      // Create a default list of buttons.
      let buttons: TValidPanelButton[] = []
      // Create a list of mini actions that are available.
      let availableMiniActions: SingleTypeObject<TValidPanelButton> = {}

      // If the object is an effect, then create mini actions for it.
      if (object instanceof ClientEffect) {
        // If the action is available then add the edit and remove buttons.
        availableMiniActions = {
          warning: {
            icon: 'warning-transparent',
            key: 'warning',
            onClick: () => {},
            cursor: 'help',
            tooltipDescription: object.invalidMessage,
          },
        }
      }

      // Add the buttons to the list.
      buttons = Object.values(availableMiniActions)

      // Return the buttons.
      return buttons
    })

    return (
      <div className='Row' key={`object-row-${object._id}`}>
        <div className='RowContent'>{object.name}</div>
        <ButtonSvgPanel buttons={buttons} size={'small'} />
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

          // Prompt the user for a choice.
          let { choice } = await prompt(
            message,
            ['Edit Mission', 'Launch Anyway', 'Cancel'],
            {
              list: {
                items: mission.defectiveObjects,
                headingText: 'Unresolved Conflicts',
                sortByMethods: [ESortByMethod.Name],
                searchableProperties: ['name'],
                renderObjectListItem: renderObjectListItem,
              },
            },
          )
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
