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
import { TWithKey } from '../../../../shared/toolbox/objects'
import Prompt from '../content/communication/Prompt'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import SessionMembersPanel from '../content/session/members/SessionMembersPanel'
import MissionMap from '../content/session/mission-map'
import ActionExecModal from '../content/session/mission-map/ui/overlay/modals/action-execution/ActionExecModal'
import { TTabBarTab } from '../content/session/mission-map/ui/tabs/TabBar'
import { OutputPanel } from '../content/session/output/'
import StatusBar from '../content/session/StatusBar'
import { TValidPanelButton } from '../content/user-controls/buttons/ButtonSvgPanel'
import { TButtonText_P } from '../content/user-controls/buttons/ButtonText'
import './SessionPage.scss'

/**
 * Renders the session page.
 */
export default function SessionPage({
  session,
}: TSessionPage_P): JSX.Element | null {
  /* -- STATE -- */

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
  const [nodeToExecute, setNodeToExecute] = useState<ClientMissionNode | null>(
    null,
  )
  const [selectedForce, selectForce] = useState<ClientMissionForce | null>(null)
  const [resourcesRemaining, setResourcesRemaining] = useState<number>(0)
  const {} = useRequireLogin()
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
    // If the member is not authorized to manipulate nodes,
    // notify the user and return.
    if (!session.member.isAuthorized('manipulateNodes')) return

    // If the node is blocked, notify the user.
    if (node.blocked) {
      notify(`"${node.name}" has been blocked and cannot be accessed.`)
      return
    }

    // If the user is a participant, request to send
    // the node's pre-execution message to the output
    // panel.
    session.sendPreExecutionMessage(node._id, {
      onError: (message) => handleError({ message, notifyMethod: 'bubble' }),
    })

    // Logic that opens the next level of nodes
    // (displays the selected node's child nodes)
    if (node.openable && !node.executable) {
      session.openNode(node._id, {
        onError: (message) => handleError({ message, notifyMethod: 'bubble' }),
      })
    }
    // If the node is ready to execute...
    else if (node.readyToExecute) {
      setNodeToExecute(node)
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
   * Callback for the reset session button.
   */
  const onClickResetSession = async () => {
    // If the session is not started, verify navigation.
    if (session.state !== 'started') {
      verifyNavigation.current()
      return
    }

    // Confirm the user wants to reset the session.
    let { choice } = await prompt(
      'Please confirm resetting the session.',
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
      beginLoading('Resetting session...')
      // Start the session.
      await session.$reset()
      // Refresh page.
      navigateTo('SessionPage', { session }, { bypassMiddleware: true })
      // Finish loading.
      finishLoading()
    } catch (error) {
      handleError({
        message: 'Failed to reset session.',
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

  /**
   * Syncs the resources remaining state with
   * the selected force.
   */
  const syncResources = () => {
    setResourcesRemaining(selectedForce?.resourcesRemaining ?? 0)
  }

  /* -- COMPUTED -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(() => {
    let links: TWithKey<TButtonText_P>[] = []
    let { accessibility } = session.config
    let canStartEndSessions = session.member.isAuthorized('startEndSessions')

    /**
     * Adds link to the navigation that will reset the progress
     * in the session.
     * @param text The text to display on the link.
     */
    const addResetSession = (text: string = 'Reset Session') => {
      links.push({
        key: 'reset-session',
        text,
        onClick: onClickResetSession,
      })
    }

    /**
     * Adds a link to the navigation to end the session.
     * @param text The text to display on the link.
     */
    const addEndSession = (text: string = 'End Session') => {
      links.push({
        key: 'end-session',
        text,
        onClick: onClickEndSession,
      })
    }

    /**
     * Adds a link to the navigation to quit the session.
     * @param text The text to display on the link.
     * @param destination The destination to navigate to when quitting.
     */
    const addQuit = (
      text: string = 'Quit',
      destination: 'HomePage' | 'MissionPage' = 'HomePage',
    ) => {
      links.push({
        key: 'quit',
        text,
        onClick: () => {
          let props = {}
          if (destination === 'MissionPage') props = { missionId: mission._id }
          navigateTo(destination, props)
        },
      })
    }

    // Add links based on the session accessibility.
    switch (accessibility) {
      case 'testing':
        // Add reset link and a quit link that
        // navigates back to the mission page.
        if (canStartEndSessions) addResetSession('Reset Play-Test')
        addQuit('Back to Mission', 'MissionPage')
        break
      default:
        // Add reset and end session links if the member
        // is authorized. Then add the quit link.
        if (canStartEndSessions) {
          addResetSession()
          addEndSession()
        }
        addQuit()
        break
    }

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

    // If the user cannot manipulate nodes, add
    // the observer class to the root element.
    if (!session.member.isAuthorized('manipulateNodes')) {
      classList.push('Observer')
    }

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
   * The class name for the resource count element.
   */
  const resourceCountClass = compute(() => {
    // Define default list.
    let resourceCountClassList: string[] = ['Count']

    // If resources are infinite, add the infinite
    // class to the resource count.
    if (session.config.infiniteResources) {
      resourceCountClassList.push('Infinite')
    }
    // If resources are finite, add the finite
    // class to the resource count.
    else {
      resourceCountClassList.push('Finite')
    }

    // Return the class list as a joined string.
    return resourceCountClassList.join(' ')
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
        type: 'user',
        description: 'Open users panel.',
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
        type: 'shell',
        description: selectedForce
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

  /**
   * Tabs for the mission map's tab bar.
   */
  const mapTabs: TTabBarTab[] = compute(() => {
    let tabs: TTabBarTab[] = mission.forces.map((force) => {
      return {
        _id: force._id,
        text: force.name,
        color: force.color,
      }
    })

    return tabs
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
    ['action-execution-initiated', 'modifier-enacted'],
    () => syncResources(),
    [selectedForce],
  )

  useEventListener(server, 'session-reset', () => {
    beginLoading('Resetting session...')
    navigateTo('SessionPage', { session }, { bypassMiddleware: true })
    finishLoading()
    notify('A manager has reset the session.')
  })

  // Update the resources remaining state whenever the
  // force changes.
  useEffect(() => syncResources(), [selectedForce])

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
    let resourceDisplay: string = session.config.infiniteResources
      ? 'ထ'
      : resourcesRemaining.toString()

    return (
      <div className='TopBar'>
        <div className='Title'>
          Session: <span className='SessionName'>{session.name} </span>
          <b>&bull;</b>
        </div>
        <div className={resourcesClass}>
          {mission.resourceLabel}:{' '}
          <span className={resourceCountClass}>{resourceDisplay}</span>
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
                tabs={mapTabs}
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
                    <OutputPanel
                      force={selectedForce}
                      selectNode={(node: ClientMissionNode | null) => {
                        // todo: Implement panning to the node on the mission map.
                        // if (node === null) {
                        //   notify(
                        //     'This node cannot be accessed from the current force.',
                        //   )
                        //   return
                        // } else if (node.executing) {
                        //   notify(
                        //     `The node "${node.name}" is currently executing and cannot be located at this time.`,
                        //   )
                        //   return
                        // } else if (node.blocked) {
                        //   notify(
                        //     `The node "${node.name}" is blocked and cannot be accessed at this time.`,
                        //   )
                        //   return
                        // }
                        // setNodeToExecute(node)
                      }}
                    />
                  ) : null
                case 'users':
                  return (
                    <SessionMembersPanel
                      session={session}
                      key={'users-panel'}
                    />
                  )
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
