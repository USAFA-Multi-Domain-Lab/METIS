import { useEffect, useRef, useState } from 'react'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { DefaultLayout, TPage_P } from '.'
import MapToolbox from '../../../../shared/toolbox/maps'
import { TWithKey } from '../../../../shared/toolbox/objects'
import Prompt from '../content/communication/Prompt'
import { HomeLink } from '../content/general-layout/Navigation'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import OutputPanel from '../content/session/OutputPanel'
import StatusBar from '../content/session/StatusBar'
import UsersPanel from '../content/session/UsersPanel'
import MissionMap from '../content/session/mission-map'
import ActionExecModal from '../content/session/mission-map/ui/overlay/modals/ActionExecModal'
import { TValidPanelButton } from '../content/user-controls/ButtonSvgPanel'
import { TButtonText } from '../content/user-controls/ButtonText'
import './SessionPage.scss'

/**
 * Renders the session page.
 */
export default function SessionPage({
  session,
}: TSessionPage_P): JSX.Element | null {
  console.log(session._id)

  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const {
    navigateTo,
    finishLoading,
    notify,
    prompt,
    handleError,
    beginLoading,
  } = globalContext.actions

  /* -- STATE -- */

  const [nodeToExecute, setNodeToExecute] = useState<ClientMissionNode | null>(
    null,
  )
  const [selectedForce, selectForce] = useState<ClientMissionForce | null>(null)
  const [resourcesRemaining, setResourcesRemaining] = useState<number>(0)
  const [login] = useRequireLogin()
  const [rightPanelTab, setRightPanelTab] =
    useState<TSessionRightPanelTab>('output')

  /* -- VARIABLES -- */

  // The mission for the session.
  let mission: ClientMission = session.mission
  // Dynamic (default) sizing of the output panel.
  let panel2DefaultSize: number = 400
  // The current aspect ratio of the window.
  let currentAspectRatio: number = window.innerWidth / window.innerHeight

  /* -- FUNCTIONS -- */

  /**
   * Handles the selection of a node in the mission map by the user.
   * @param node The node that was selected.
   */
  const onNodeSelect = async (node: ClientMissionNode): Promise<void> => {
    // If the role is 'supervisor', abort
    // selection handling.
    if (session.role === 'supervisor') {
      return
    }

    // If the node is blocked, notify the user.
    if (node.blocked) {
      notify(`"${node.name}" has been blocked and cannot be accessed.`)
      return
    }

    // If the user is a participant, request to send
    // the node's pre-execution message to the output
    // panel.
    if (session.role === 'participant') {
      session.sendPreExecutionMessage(node._id, {
        onError: (message) => handleError({ message, notifyMethod: 'bubble' }),
      })
    }

    // Logic that opens the next level of nodes
    // (displays the selected node's child nodes)
    if (node.openable && !node.executable) {
      session.openNode(node._id, {
        onError: (message) => handleError({ message, notifyMethod: 'bubble' }),
      })
    }
    // If the node is ready to execute...
    else if (node.readyToExecute) {
      // If there are no more resources left
      // to spend, notify the user.
      if (node.force.resourcesRemaining === 0) {
        notify(`You have no more resources left to spend.`)
      }
      // If there is not enough resources to
      // execute an action, notify the user.
      else if (
        !MapToolbox.mapToArray(
          node.actions,
          (action) => action.resourceCost <= node.force.resourcesRemaining,
        ).includes(true)
      ) {
        notify('Insufficient resources available to execute action.')
      }
      // Else, select the node.
      else {
        setNodeToExecute(node)
      }
    }
  }

  /**
   * Callback for the end session button.
   */
  const onClickEndSession = async () => {
    // If the session is not started, verify navigation.
    if (session.state !== 'started') {
      verifyNavigation.current()
      return
    }

    // Confirm the user wants to end the session.
    let { choice } = await prompt(
      'Please confirm ending the session.',
      Prompt.ConfirmationChoices,
    )

    // If the user cancels, return.
    if (choice === 'Cancel') {
      return
    }

    try {
      // Clear verify navigation function to prevent double
      // redirect.
      verifyNavigation.current = () => {}
      // Begin loading.
      beginLoading('Ending session...')
      // Start the session.
      await session.$end()
      // Redirect to session page.
      navigateTo('HomePage', {}, { bypassMiddleware: true })
    } catch (error) {
      handleError({
        message: 'Failed to end session.',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Redirects to the correct page based on
   * the session state. Stays on the same page
   * if the session is started and not ended.
   */
  const verifyNavigation = useRef(() => {
    // If the session is unstarted, navigate to the lobby page.
    if (session.state === 'unstarted') {
      navigateTo('LobbyPage', { session }, { bypassMiddleware: true })
    }
    // If the session is ended, navigate to the home page.
    if (session.state === 'ended') {
      navigateTo('HomePage', {}, { bypassMiddleware: true })
    }
  })

  /* -- COMPUTED -- */

  /**
   * The initial resources for the selected force.
   */
  const initialResources = compute(() => {
    return selectedForce?.initialResources ?? 0
  })

  /**
   * Props for navigation.
   */
  const navigation = compute(() => {
    let links: TWithKey<TButtonText>[] = []

    // Push end session button, if user is authorized.
    if (
      login.user.isAuthorized('sessions_join_manager') ||
      login.user.isAuthorized('sessions_join_observer')
    ) {
      links.push({
        key: 'end-session',
        text: 'End Session',
        onClick: onClickEndSession,
      })
    }

    // Push quit button.
    links.push(HomeLink(globalContext, { text: 'Quit' }))

    // Return navigation.
    return {
      links,
      logoLinksHome: false,
    }
  })

  /**
   * Class for root element.
   */
  const rootClass = compute((): string => {
    let classList: string[] = ['SessionPage', 'Page']

    // Add the role to the class list.
    classList.push(session.role)

    // Return the class list as a joined string.
    return classList.join(' ')
  })

  /**
   * The class name for the resources element.
   */
  const resourcesClass = compute(() => {
    // Define default list.
    let resourcesClassList: string[] = ['Resources']

    // If there is no force selected, hide
    // the resources.
    if (!selectedForce) resourcesClassList.push('Hidden')
    // If resources are not infinite, and the mission
    // has no resources left, add the red alert
    // class to the resources.
    if (!session.config.infiniteResources && resourcesRemaining <= 0) {
      resourcesClassList.push('RedAlert')
    }

    // Return the class list as a joined string.
    return resourcesClassList.join(' ')
  })

  /**
   * Custom buttons for the mission map.
   */
  const customButtons = compute((): TValidPanelButton[] => {
    let buttons: TValidPanelButton[] = []

    // If the right panel tab is the output panel,
    // push the button to change it to the users panel.
    if (rightPanelTab === 'output') {
      buttons.push({
        key: 'users',
        icon: 'user',
        tooltipDescription: 'Open users panel.',
        onClick: () => {
          setRightPanelTab('users')
        },
      })
    }
    // If the right panel tab is the users panel,
    // push the button to change it to the output panel.
    else if (rightPanelTab === 'users') {
      buttons.push({
        key: 'output',
        icon: 'shell',
        tooltipDescription: selectedForce
          ? 'Open output panel.'
          : 'Cannot open the output panel at this time. Please contact your system administrator.',
        disabled: selectedForce === undefined ? 'partial' : 'none',
        onClick: () => {
          if (selectedForce) setRightPanelTab('output')
        },
      })
    }

    // Return the buttons.
    return buttons
  })

  /* -- EFFECTS -- */

  // Verify navigation on mount and on session state change.
  useMountHandler((done) => {
    if (selectedForce === undefined) setRightPanelTab('users')
    finishLoading()
    verifyNavigation.current()
    done()
  })
  // Verify navigation if the session is ended or destroyed.
  useEventListener(server, ['session-started', 'session-ended'], () =>
    verifyNavigation.current(),
  )

  // Add navigation middleware to properly
  // quit the session before the user navigates
  // away.
  useNavigationMiddleware(async (to, next) => {
    // Prompt the user for confirmation.
    let { choice } = await prompt(
      'Are you sure you want to quit?',
      Prompt.YesNoChoices,
    )

    // If the user confirms quit, proceed.
    if (choice === 'Yes') {
      try {
        await session.$quit()
        next()
      } catch (error) {
        handleError({
          message: 'Failed to quit session.',
          notifyMethod: 'bubble',
        })
      }
    }
  })

  // Update the resources remaining when an action is executed.
  useEventListener(
    server,
    'action-execution-initiated',
    () => {
      setResourcesRemaining(selectedForce?.resourcesRemaining ?? 0)
    },
    [selectedForce],
  )

  // Update the resources remaining state whenever the
  // force changes.
  useEffect(() => {
    setResourcesRemaining(selectedForce?.resourcesRemaining ?? 0)
  }, [selectedForce])

  /* -- PRE-RENDER PROCESSING -- */

  // If the aspect ratio is greater than or equal to 16:9,
  // and the window width is greater than or equal to 1850px,
  // then the default size of the output panel will be 40%
  // of the width of the window.
  if (currentAspectRatio >= 16 / 9 && window.innerWidth >= 1850) {
    panel2DefaultSize = window.innerWidth * 0.4
  }

  /* -- RENDER -- */

  /**
   * JSX for the top bar element.
   */
  const topBarJsx = compute((): JSX.Element | null => {
    return (
      <div className='TopBar'>
        <div className={resourcesClass}>
          Resources:{' '}
          {session.config.infiniteResources ? (
            <span className='Count Infinite'>ထ</span>
          ) : (
            <span className='Count Finite'>
              {resourcesRemaining} / {initialResources}
            </span>
          )}
        </div>
        <StatusBar />
      </div>
    )
  })

  /**
   * JSX for the overlay content.
   */
  const overlayContentJsx = compute((): JSX.Element | undefined => {
    // If there is a selected node and not
    // a selected action, render a prompt to
    // select an action for the node.
    if (nodeToExecute) {
      return (
        <ActionExecModal
          node={nodeToExecute}
          session={session}
          close={() => setNodeToExecute(null)}
        />
      )
    }
    // Else, don't render any overlay content.
    else {
      return undefined
    }
  })

  // Return the rendered component.
  return (
    <div className={rootClass}>
      <DefaultLayout navigation={navigation} includeFooter={false}>
        {topBarJsx}
        <PanelSizeRelationship
          sizingMode={EPanelSizingMode.Panel1_Auto__Panel2_Defined}
          initialDefinedSize={panel2DefaultSize}
          panel1={{
            ...ResizablePanel.defaultProps,
            minSize: 400,
            render: () => (
              <MissionMap
                mission={mission}
                overlayContent={overlayContentJsx}
                customButtons={customButtons}
                showMasterTab={false}
                onNodeSelect={onNodeSelect}
                selectedForce={[selectedForce, selectForce]}
              />
            ),
          }}
          panel2={{
            ...ResizablePanel.defaultProps,
            minSize: 400,
            isOpen: true,
            render: () => {
              switch (rightPanelTab) {
                case 'output':
                  return selectedForce ? (
                    <OutputPanel force={selectedForce} />
                  ) : null
                case 'users':
                  return <UsersPanel session={session} key={'users-panel'} />
                default:
                  return null
              }
            },
          }}
        />
      </DefaultLayout>
    </div>
  )
}

/* -- types -- */

/**
 * Prop type for `SessionPage`.
 */
export interface TSessionPage_P extends TPage_P {
  /**
   * The session client to use on the page.
   */
  session: SessionClient
}

/**
 * Available tabs for the right panel on the session page.
 */
export type TSessionRightPanelTab = 'output' | 'users'
