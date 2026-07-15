import {
  useGlobalContext,
  useNavigationMiddleware,
} from '@client/context/global'
import { LocalContextProvider } from '@client/context/local'
import type { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import type { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import type { ClientResourcePool } from '@client/missions/forces/ClientResourcePool'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import {
  useDefaultProps,
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from '@client/toolbox/hooks'
import type { TSessionPanelAlert } from '@shared/connect'
import type { NodeAlert } from '@shared/missions/nodes/NodeAlert'
import { useEffect, useState } from 'react'
import type { TPage_P } from '..'
import { DefaultPageLayout } from '..'
import PendingPageModal from '../../content/communication/PendingPageModal'
import Prompt from '../../content/communication/Prompt'
import MissionFileList from '../../content/data/lists/implementations/MissionFileList'
import Panel from '../../content/general-layout/panels/Panel'
import PanelLayout from '../../content/general-layout/panels/PanelLayout'
import PanelView from '../../content/general-layout/panels/PanelView'
import SessionMembersPanel from '../../content/session/members/SessionMembersPanel'
import MissionMap from '../../content/session/mission-map/MissionMap'
import NodeAlertIndicator from '../../content/session/mission-map/ui/indicators/NodeAlertIndicator'
import ActionExecModal from '../../content/session/mission-map/ui/overlay/modals/action-execution/ActionExecModal'
import type { TTabBarTab } from '../../content/session/mission-map/ui/tabs/TabBar'
import NodeAlertBox from '../../content/session/mission-map/ui/toasts/NodeAlertBox'
import { OutputPanel } from '../../content/session/output'
import { useButtonSvgEngine } from '../../content/user-controls/buttons/panels/hooks'
import { sessionPageContext } from './context'
import './SessionPage.scss'
import SessionTopBar from './subcomponents/SessionTopBar'
import { useSessionPageNavigation } from './subcomponents/useSessionPageNavigation'

/* -- CONSTANTS -- */

/**
 * The default size of the output panel (right panel) on
 * the session page, in pixels.
 */
const SECONDARY_PANEL_DEFAULT_SIZE: number = 400 //px

/**
 * The titles for the right-side panel tabs. Centralised here so that
 * event-listener guards, `onViewSelected` handlers, and `PanelView`
 * title props all share a single source of truth.
 */
export const RIGHT_PANEL: TPanelTitles = {
  OUTPUT: 'Output',
  MESSENGER: 'Messenger',
  FILES: 'Files',
  MEMBERS: 'Members',
}

/* -- COMPONENT -- */

/**
 * Renders the session page.
 */
export default function SessionPage(
  props: TSessionPage_P,
): TReactElement | null {
  /* -- PROPS -- */

  const defaultedProps = useDefaultProps(props, {})
  const { session, returnPage } = defaultedProps
  const { subscribedMission } = session

  /* -- BUTTON ENGINE(S) -- */

  const mapButtonEngine = useButtonSvgEngine({})

  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const state: TSessionPage_S = {
    resourcePools: useState<ClientResourcePool[]>([]),
    messengerHasUnreadMessages: useState<boolean>(
      session.pendingSessionPanelAlerts.includes(RIGHT_PANEL.MESSENGER),
    ),
    activeRightPanel: useState<TSessionPanelAlert | null>(null),
  }
  const [server] = globalContext.server
  const {
    navigateTo,
    finishLoading,
    notify,
    prompt,
    handleError,
    beginLoading,
  } = globalContext.actions
  const { navigation, navigationButtonEngine, initializeNavigation } =
    useSessionPageNavigation(defaultedProps)
  const [nodeToExecute, setNodeToExecute] = useState<ClientMissionNode | null>(
    null,
  )
  const [selectedForce, selectForce] = useState<ClientMissionForce | null>(null)
  const [, setResourcePools] = state.resourcePools
  const {} = useRequireLogin()
  const [localFiles, setLocalFiles] = useState<ClientMissionFile[]>(
    subscribedMission.files,
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
  const [messengerHasUnreadMessages, setMessengerHasUnreadMessages] =
    state.messengerHasUnreadMessages
  const [outputHasNew, setOutputHasNew] = useState<boolean>(
    session.pendingSessionPanelAlerts.includes(RIGHT_PANEL.OUTPUT),
  )
  const [filesHasNew, setFilesHasNew] = useState<boolean>(
    session.pendingSessionPanelAlerts.includes(RIGHT_PANEL.FILES),
  )
  const [activeRightPanel, setActiveRightPanel] = state.activeRightPanel

  /* -- FUNCTIONS -- */

  /**
   * Syncs the resources remaining state with
   * the selected force.
   */
  const syncResources = () => {
    setResourcePools(selectedForce?.includedPools ?? [])
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
   * Tabs for the mission map's tab bar.
   */
  const mapTabs: TTabBarTab[] = compute(() => {
    let tabs: TTabBarTab[] = subscribedMission.forces.map((force) => {
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
  useEventListener(server, 'session-reset', () => {
    selectForce(
      () => subscribedMission.getForceById(selectedForce?._id) ?? null,
    )
    notify('All progress has been reset by a manager.')
  })

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
    ['action-execution-initiated', 'resource-pool-updated'],
    () => syncResources(),
  )

  useEventListener(server, 'session-resetting', () => {
    setResetInitiated(true)
    navigationButtonEngine.disable('stop').disable('reset')
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

  // On script executions, detect whether setup or teardown has failed.
  useEventListener(server, 'session-task-update', () => {
    setResetSetupFailed(session.setupFailed)
    setResetTeardownFailed(session.teardownFailed)
  })

  // Update the list of local files when file access is granted or revoked.
  useEventListener(subscribedMission, 'file-access-granted', () => {
    setLocalFiles([...subscribedMission.files])
  })

  useEventListener(subscribedMission, 'file-access-revoked', () => {
    setLocalFiles([...subscribedMission.files])
  })

  // Recheck whether there are pending alerts
  // whenever a new-alert event is received from
  // the server.
  useEventListener(
    server,
    ['node-alert-added', 'node-alert-acknowledged'],
    () => {
      refreshAlerts()
    },
  )

  // Highlight the appropriate tab when the server reports new activity.
  useEventListener(
    server,
    'session-panel-alert',
    (event: { data: { panels: TSessionPanelAlert[] } }) => {
      for (const panel of event.data.panels) {
        if (
          panel === RIGHT_PANEL.OUTPUT &&
          activeRightPanel !== RIGHT_PANEL.OUTPUT
        ) {
          setOutputHasNew(true)
        }

        if (
          panel === RIGHT_PANEL.MESSENGER &&
          activeRightPanel !== RIGHT_PANEL.MESSENGER
        ) {
          setMessengerHasUnreadMessages(true)
        }

        if (
          panel === RIGHT_PANEL.FILES &&
          activeRightPanel !== RIGHT_PANEL.FILES
        ) {
          setFilesHasNew(true)
        }
      }
    },
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
      navigationButtonEngine.disable('stop').disable('reset')
    }
  }, [resetInitiated])

  /* -- RENDER -- */

  // Return the rendered component.
  return (
    <LocalContextProvider
      context={sessionPageContext}
      defaultedProps={defaultedProps}
      computed={{}}
      state={state}
      elements={{}}
    >
      <div className={rootClass}>
        <DefaultPageLayout navigation={navigation} includeFooter={false}>
          <SessionTopBar />
          <PanelLayout initialSizes={['fill', secondaryPanelInitialSize]}>
            <Panel>
              <PanelView title='Map'>
                <MissionMap
                  mission={subscribedMission}
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
            <Panel
              onViewSelected={(title) => {
                setActiveRightPanel(title as TSessionPanelAlert)

                switch (title) {
                  case RIGHT_PANEL.OUTPUT:
                    setOutputHasNew(false)
                    session.acknowledgeSessionPanelAlert('Output')
                    break
                  case RIGHT_PANEL.FILES:
                    setFilesHasNew(false)
                    session.acknowledgeSessionPanelAlert('Files')
                    break
                }
              }}
            >
              <PanelView
                title={RIGHT_PANEL.OUTPUT}
                highlighted={outputHasNew}
                description={
                  outputHasNew ? '**New output(s) available**' : undefined
                }
              >
                {Boolean(selectedForce) && (
                  <OutputPanel force={selectedForce!} />
                )}
              </PanelView>
              {/** <PanelView
                title={RIGHT_PANEL.MESSENGER}
                highlighted={messengerHasUnreadMessages}
                description={
                  messengerHasUnreadMessages
                    ? `**New message(s) available**`
                    : undefined
                }
              >
                <MessengerPanel session={session} />
              </PanelView> **/}
              <PanelView
                title={RIGHT_PANEL.FILES}
                highlighted={filesHasNew}
                description={
                  filesHasNew ? '**New file(s) available**' : undefined
                }
              >
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
              <PanelView title={RIGHT_PANEL.MEMBERS}>
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
    </LocalContextProvider>
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
 * Computed values shared across the {@link SessionPage} tree.
 */
export type TSessionPage_C = {}

/**
 * State shared across the {@link SessionPage} tree.
 */
export type TSessionPage_S = {
  /**
   * Synchronized list of resource pools retrieved from the
   * session state and updates when relevant events occur.
   */
  resourcePools: TReactState<ClientResourcePool[]>
  /**
   * Whether the Messenger tab has unread messages in any channel.
   */
  messengerHasUnreadMessages: TReactState<boolean>
  /**
   * The right-panel tab that's currently active.
   */
  activeRightPanel: TReactState<TSessionPanelAlert | null>
}

/**
 * Element refs shared across the {@link SessionPage} tree.
 */
export type TSessionPage_E = {}

/**
 * The titles for the panels in the session page.
 */
type TPanelTitles = {
  /**
   * The title for the output panel tab.
   */
  readonly OUTPUT: Extract<TSessionPanelAlert, 'Output'>
  /**
   * The title for the messenger panel tab.
   */
  readonly MESSENGER: Extract<TSessionPanelAlert, 'Messenger'>
  /**
   * The title for the files panel tab.
   */
  readonly FILES: Extract<TSessionPanelAlert, 'Files'>
  /**
   * The title for the members panel tab.
   */
  readonly MEMBERS: Extract<TSessionPanelAlert, 'Members'>
}
