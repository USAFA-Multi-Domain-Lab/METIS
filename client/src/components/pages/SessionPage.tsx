import {
  useGlobalContext,
  useNavigationMiddleware,
} from '@client/context/global'
import type { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import type { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from '@client/toolbox/hooks'
import { useSessionRedirects } from '@client/toolbox/hooks/sessions'
import type { TForceResourcePool } from '@shared/missions/forces/MissionForce'
import type { NodeAlert } from '@shared/missions/nodes/NodeAlert'
import { useEffect, useState } from 'react'
import type { TPage_P } from '.'
import { DefaultPageLayout } from '.'
import PendingPageModal from '../content/communication/PendingPageModal'
import Prompt from '../content/communication/Prompt'
import MissionFileList from '../content/data/lists/implementations/MissionFileList'
import type { TNavigation_P } from '../content/general-layout/Navigation'
import Panel from '../content/general-layout/panels/Panel'
import PanelLayout from '../content/general-layout/panels/PanelLayout'
import PanelView from '../content/general-layout/panels/PanelView'
import SessionMembersPanel from '../content/session/members/SessionMembersPanel'
import MissionMap from '../content/session/mission-map/MissionMap'
import NodeAlertIndicator from '../content/session/mission-map/ui/indicators/NodeAlertIndicator'
import ActionExecModal from '../content/session/mission-map/ui/overlay/modals/action-execution/ActionExecModal'
import type { TTabBarTab } from '../content/session/mission-map/ui/tabs/TabBar'
import NodeAlertBox from '../content/session/mission-map/ui/toasts/NodeAlertBox'
import { OutputPanel } from '../content/session/output/'
import StatusBar from '../content/session/StatusBar'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import If from '../content/util/If'
import './SessionPage.scss'

/* -- CONSTANTS -- */

/**
 * The default size of the output panel (right panel) on
 * the session page, in pixels.
 */
const SECONDARY_PANEL_DEFAULT_SIZE: number = 400 //px

/* -- COMPONENT -- */

/**
 * Renders the session page.
 */
export default function SessionPage({
  session,
  session: { mission },
  returnPage,
}: TSessionPage_P): TReactElement | null {
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
  const [resourcePools, setResourcePools] = useState<TForceResourcePool[]>([])
  const {} = useRequireLogin()
  const navButtonEngine = useButtonSvgEngine({
    elements: [],
  })
  const mapButtonEngine = useButtonSvgEngine({})
  const [localFiles, setLocalFiles] = useState<ClientMissionFile[]>(
    mission.files,
  )
  const { verifyNavigation, navigateToReturnPage } = useSessionRedirects(
    session,
    { returnPage },
  )
  const [resetInitiated, setResetInitiated] = useState<boolean>(
    session.state === 'resetting',
  )
  const [resetSetupFailed, setResetSetupFailed] = useState<boolean>(
    session.setupFailed,
  )
  const [resetTeardownFailed, setResetTeardownFailed] = useState<boolean>(
    session.teardownFailed,
  )
  const [pendingAlerts, setPendingAlerts] = useState<NodeAlert[]>(
    selectedForce?.pendingAlerts ?? [],
  )
  const [activePendingAlert, setActivePendingAlert] =
    useState<NodeAlert | null>(null)

  /* -- FUNCTIONS -- */

  /**
   * Initializes the navigation for the session page
   * based on the context for which it is being used.
   */
  const initializeNavigation = () => {
    let { accessibility } = session.config
    let canStartEndSessions = session.member.isAuthorized('startEndSessions')

    /**
     * Adds a button to the navigation that will reset the progress
     * in the session.
     * @param description The text to display on the button when
     * hovered over.
     */
    const addResetSession = (description: string = 'Reset session') => {
      navButtonEngine.add({
        key: 'reset',
        type: 'button',
        icon: 'reset',
        description,
        onClick: onClickResetSession,
      })
    }

    /**
     *  Adds a button to the navigation to end the session.
     * @param description The text to display on the button when
     * hovered over.
     */
    const addEndSession = (description: string = 'End Session') => {
      navButtonEngine.add({
        key: 'stop',
        type: 'button',
        icon: 'stop',
        description,
        onClick: onClickEndSession,
      })
    }

    /**
     * Adds a button to the navigation to quit the session.
     * @param description The text to display on the button when
     * hovered over.
     * @param destination The destination to navigate to when quitting.
     */
    const addQuit = (description: string = 'Quit') => {
      navButtonEngine.add({
        key: 'quit',
        type: 'button',
        icon: 'quit',
        description,
        onClick: () => {
          navigateToReturnPage()
        },
      })
    }

    // Add links based on the session accessibility.
    switch (accessibility) {
      case 'testing':
        // Add reset link and a quit link that
        // navigates back to the mission page.
        if (canStartEndSessions) addResetSession('Reset play-test')
        addQuit('Quit play-test')
        break
      default:
        // Add reset and end session links if the member
        // is authorized. Then add the quit link.
        if (canStartEndSessions) {
          addEndSession()
          addResetSession()
        }
        addQuit()
        break
    }
  }
  /**
   * Syncs the resources remaining state with
   * the selected force.
   */
  const syncResources = () => {
    setResourcePools(selectedForce?.resourcePools ?? [])
  }

  /**
   * Rechecks the current state of the selected force's
   * pending alerts.
   */
  const refreshAlerts = () => {
    setPendingAlerts(selectedForce?.pendingAlerts ?? [])
  }

  /**
   * Handles the selection of a node in the mission map by the user.
   * @param node The node that was selected.
   */
  const onNodeSelect = async (node: ClientMissionNode): Promise<void> => {
    // If the node has pending alerts,
    // display the next one, overriding all other
    // logic.
    let nextAlert = node.nextPendingAlert
    if (nextAlert) {
      setActivePendingAlert(nextAlert)
      return
    }

    // If the member is not authorized to manipulate nodes,
    // notify the user and return.
    if (!session.member.isAuthorized('manipulateNodes')) return

    // If the node is blocked, notify the user.
    if (node.blockStatus === 'blocked') {
      notify(`"${node.name}" has been blocked and cannot be accessed.`)
      return
    }
    // If the node is cut-off, notify the user.
    else if (node.blockStatus === 'cut-off') {
      notify(
        `You cannot access "${node.name}" because a node upstream has been blocked.`,
      )
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
      // End the session.
      await session.$end({
        onInit: () => {
          // Go to return page once the session
          // end has been initiated. Tear down
          // does not need to hold up navigation.
          navigateToReturnPage({ bypassMiddleware: true })
        },
      })
      notify(
        `"${session.name}" teardown complete. Session will now be deleted.`,
      )
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
      // Start the session.
      await session.$reset()
      // Refresh page.
      navigateTo(
        'SessionPage',
        { session, returnPage },
        { bypassMiddleware: true },
      )
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
   * Callback for when the user clicks the alert indicator,
   * requesting to see the next pending alert, starting with that
   * of highest priority. In doing so, the map will center
   * on the node with the alert.
   */
  const onClickAlertIndicator = () => {
    let nextPendingAlert = selectedForce?.nextPendingAlert
    let alertNode = selectedForce?.getNode(
      nextPendingAlert?.nodeId ?? 'no-alert-node',
    )

    if (!selectedForce || !nextPendingAlert || !alertNode) {
      console.warn('Cannot show alert; missing data.')
      return
    }

    setActivePendingAlert(nextPendingAlert)
    alertNode.requestCenterOnMap()
  }

  /**
   * Callback for when the user requests to see
   * the next pending alert.
   */
  const onNextPendingAlert = async () => {
    let currentAlertNode = selectedForce?.getNode(
      activePendingAlert?.nodeId ?? 'no-alert-node',
    )

    if (!selectedForce || !activePendingAlert || !currentAlertNode) {
      console.warn('Cannot acknowledge alert; missing data.')
      return
    }

    try {
      // Pre-update acknowledged to true for immediate
      // responsivity. If an error is thrown, this will
      // change back.
      currentAlertNode.onAlertAcknowledgement(activePendingAlert._id)
      refreshAlerts()

      await session.$acknowledgeNodeAlert(
        activePendingAlert._id,
        activePendingAlert.nodeId,
      )

      // After acknowledging, get the next pending alert
      let nextPendingAlert = selectedForce.nextPendingAlert
      let nextAlertNode = selectedForce.getNode(
        nextPendingAlert?.nodeId ?? 'no-alert-node',
      )

      if (nextPendingAlert && nextAlertNode) {
        setActivePendingAlert(nextPendingAlert)
        nextAlertNode.requestCenterOnMap()
      } else {
        setActivePendingAlert(null)
      }
    } catch (error) {
      currentAlertNode.onAlertAcknowledgementError(activePendingAlert._id)
      refreshAlerts()
      handleError({
        message: 'Failed to acknowledge node alert.',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Callback for when the user requests to acknowledge
   * the active pending alert, dismissing the animation and alert
   * box.
   */
  const onAcknowledgePendingAlert = async () => {
    let alertNode = selectedForce?.getNode(
      activePendingAlert?.nodeId ?? 'no-alert-node',
    )

    if (!selectedForce || !activePendingAlert || !alertNode) {
      console.warn('Cannot acknowledge alert; missing data.')
      return
    }

    try {
      // Pre-update acknowledged to true for immediate
      // responsivity. If an error is thrown, this will
      // change back.
      alertNode.onAlertAcknowledgement(activePendingAlert._id)
      setActivePendingAlert(null)
      refreshAlerts()

      await session.$acknowledgeNodeAlert(
        activePendingAlert._id,
        activePendingAlert.nodeId,
      )
    } catch (error) {
      alertNode.onAlertAcknowledgementError(activePendingAlert._id)
      refreshAlerts()
      handleError({
        message: 'Failed to acknowledge node alert.',
        notifyMethod: 'bubble',
      })
    }
  }

  /* -- COMPUTED  -- */

  /**
   * Props for navigation.
   */
  const navigation = compute<TNavigation_P>(() => {
    return {
      buttonEngine: navButtonEngine,
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
    // todo: RedAlert should be per resource pool, not the entire resources element.
    if (
      !session.config.infiniteResources &&
      resourcePools.some(
        (pool) => (pool.resourcesRemaining ?? pool.initialAmount) <= 0,
      )
    ) {
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

  /**
   * The message to display when the session is resetting.
   */
  const sessionResetMessage = compute((): string => {
    if (resetSetupFailed) {
      return 'The session encountered an error during setup. For details concerning the error, please reference the server logs. Please navigate home and perform a hard delete. Then, relaunch the session and try again.'
    } else if (resetTeardownFailed) {
      return 'The session encountered an error during teardown. For details concerning the error, please reference the server logs. Please navigate home and perform a hard delete. Then, relaunch the session and try again.'
    } else {
      return 'Session reset initiated by a manager. Once teardown and setup are complete, the page will refresh...'
    }
  })

  /**
   * The initial size of the secondary panel (output panel) in
   * pixels. This is responsive and will adjust based on the
   * aspect ratio and width of the window.
   */
  const secondaryPanelInitialSize = compute<number>(() => {
    let result: number = SECONDARY_PANEL_DEFAULT_SIZE
    let aspectRatio: number = window.innerWidth / window.innerHeight

    if (aspectRatio >= 16 / 9 && window.innerWidth >= 1850) {
      result = window.innerWidth * 0.4
    }

    return result
  })

  /**
   * The next pending alert for the selected
   * force, if it exists.
   */
  const nextPendingAlert = compute<NodeAlert | null>(() => {
    return selectedForce?.nextPendingAlert ?? null
  })

  /* -- EFFECTS -- */

  useMountHandler((done) => {
    // Initialize the navigation bar.
    initializeNavigation()
    // Hide preferences button on the map.
    mapButtonEngine.hide('preferences')
    finishLoading()
    done()
  })

  // On session reset, reselect the force in
  // the mission, since a new force object
  // will be created.
  useEventListener(
    server,
    'session-reset',
    () => {
      selectForce(() => mission.getForceById(selectedForce?._id) ?? null)
      notify('All progress has been reset by a manager.')
    },
    [selectedForce],
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

  useEventListener(server, 'session-resetting', () => {
    setResetInitiated(true)
    navButtonEngine.disable('stop').disable('reset')
  })

  useEventListener(server, 'session-reset', () => {
    beginLoading('Refreshing page...')
    navigateTo(
      'SessionPage',
      { session, returnPage },
      { bypassMiddleware: true },
    )
    finishLoading()
    notify('All progress has been reset by a manager.')
  })

  // On setup updates, detect whether the process has failed.
  useEventListener(
    server,
    ['session-setup-update', 'session-teardown-update'],
    () => {
      setResetSetupFailed(session.setupFailed)
      setResetTeardownFailed(session.teardownFailed)
    },
    [session],
  )

  // Update the list of local files when file access
  // is granted or revoked.
  useEventListener(
    mission,
    ['file-access-granted', 'file-access-revoked'],
    () => setLocalFiles([...mission.files]),
  )

  // Recheck whether there are pending alerts
  // whenever a new-alert event is received from
  // the server.
  useEventListener(
    server,
    ['modifier-enacted', 'node-alert-acknowledged'],
    () => {
      refreshAlerts()
    },
    [selectedForce],
  )

  // Update the resources remaining state whenever the
  // force changes. Also check the new force if there
  // are pending alerts.
  useEffect(() => {
    syncResources()
    refreshAlerts()
  }, [selectedForce])

  useEffect(() => {
    if (resetInitiated) {
      navButtonEngine.disable('stop').disable('reset')
    }
  }, [resetInitiated])

  /* -- RENDER -- */

  /**
   * JSX for the top bar element.
   */
  const topBarJsx = compute((): TReactElement | null => {
    // todo: Code kept for reference, remove in the future.
    // let resourceDisplay: string = session.config.infiniteResources
    //   ? 'ထ'
    //   : resourcesRemaining.toString()

    return (
      <div className='TopBar'>
        <div className='Title'>
          Session: <span className='SessionName'>{session.name} </span>
          <b>&bull;</b>
        </div>
        {resourcePools.map((pool) => {
          let resourceDef = mission.resources.find((r) => r._id === pool.poolId)
          let label = resourceDef?.label ?? pool.poolId
          let remaining = pool.resourcesRemaining ?? pool.initialAmount
          let display = session.config.infiniteResources
            ? 'ထ'
            : remaining.toString()
          let poolClass = ['Resources']
          if (!selectedForce) poolClass.push('Hidden')
          if (!session.config.infiniteResources && remaining <= 0) {
            poolClass.push('RedAlert')
          }
          return (
            <div key={pool.poolId} className={poolClass.join(' ')}>
              {label}: <span className={resourceCountClass}>{display}</span>
            </div>
          )
        })}
        <StatusBar />
      </div>
    )
  })

  // Return the rendered component.
  return (
    <div className={rootClass}>
      <DefaultPageLayout navigation={navigation} includeFooter={false}>
        {topBarJsx}
        <PanelLayout initialSizes={['fill', secondaryPanelInitialSize]}>
          <Panel>
            <PanelView title='Map'>
              <MissionMap
                mission={mission}
                buttonEngine={mapButtonEngine}
                tabs={mapTabs}
                showMasterTab={false}
                onNodeSelect={onNodeSelect}
                selectedForce={[selectedForce, selectForce]}
              >
                <ActionExecModal
                  node={[nodeToExecute, setNodeToExecute]}
                  session={session}
                />
                <NodeAlertIndicator
                  nextPendingAlert={nextPendingAlert}
                  onClick={onClickAlertIndicator}
                />
                <NodeAlertBox
                  alert={activePendingAlert}
                  areMorePendingAlerts={pendingAlerts.length > 1}
                  next={onNextPendingAlert}
                  acknowledge={onAcknowledgePendingAlert}
                />
              </MissionMap>
            </PanelView>
          </Panel>
          <Panel>
            <PanelView title='Output'>
              <If condition={!!selectedForce}>
                <OutputPanel force={selectedForce!} />
              </If>
            </PanelView>
            <PanelView title='Files'>
              <MissionFileList
                name={'Files'}
                items={localFiles}
                itemsPerPageMin={4}
                columns={[]}
                itemButtonIcons={['download']}
                getItemButtonLabel={(button) => {
                  switch (button) {
                    case 'download':
                      return 'Download'
                    default:
                      return ''
                  }
                }}
                onItemDblClick={(item) =>
                  item.download({ method: 'session-api' })
                }
                onItemButtonClick={(button, item) => {
                  switch (button) {
                    case 'download':
                      item.download({ method: 'session-api' })
                      break
                    default:
                      break
                  }
                }}
              />
            </PanelView>
            <PanelView title='Members'>
              <SessionMembersPanel session={session} key={'members-panel'} />
            </PanelView>
          </Panel>
        </PanelLayout>
        <PendingPageModal
          message={sessionResetMessage}
          active={resetInitiated}
          erroneous={resetSetupFailed || resetTeardownFailed}
        />
      </DefaultPageLayout>
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
  /**
   * The page to return to when the session is ended.
   */
  returnPage: 'HomePage' | 'MissionPage'
}

/**
 * Available tabs for the right panel on the session page.
 */
export type TSessionRightPanelTab = 'output' | 'users'
