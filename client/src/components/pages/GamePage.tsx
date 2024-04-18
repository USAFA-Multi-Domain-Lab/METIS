import { useRef, useState } from 'react'
import { IConsoleOutput } from 'src/components/content/game/ConsoleOutput'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import GameClient from 'src/games'
import ClientMission from 'src/missions'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  useMountHandler,
  useRequireSession,
} from 'src/toolbox/hooks'
import { DefaultLayout, TPage_P } from '.'
import MapToolbox from '../../../../shared/toolbox/maps'
import { TWithKey } from '../../../../shared/toolbox/objects'
import Prompt from '../content/communication/Prompt'
import OutputPanel from '../content/game/OutputPanel'
import StatusBar from '../content/game/StatusBar'
import UsersPanel from '../content/game/UsersPanel'
import MissionMap from '../content/game/mission-map'
import ActionExecModal from '../content/game/mission-map/ui/overlay/modals/ActionExecModal'
import { HomeLink } from '../content/general-layout/Navigation'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import { TValidPanelButton } from '../content/user-controls/ButtonSvgPanel'
import { TButtonText } from '../content/user-controls/ButtonText'
import './GamePage.scss'

/**
 * Renders the game page.
 */
export default function GamePage({ game }: TGamePage_P): JSX.Element | null {
  console.log(game.gameId)

  /* -- global-context -- */

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

  /* -- state -- */

  const [nodeToExecute, setNodeToExecute] = useState<ClientMissionNode | null>(
    null,
  )
  const [resources, setResources] = useState<number>(game.resources)
  const [session] = useRequireSession()
  const [rightPanelTab, setRightPanelTab] =
    useState<TGameRightPanelTab>('output')

  /* -- variables -- */

  let mission: ClientMission = game.mission
  // Dynamic (default) sizing of the output panel.
  let panel2DefaultSize: number = 400
  // The current aspect ratio of the window.
  let currentAspectRatio: number = window.innerWidth / window.innerHeight

  /* -- functions -- */

  /**
   * Outputs to the in-browser console.
   * @param {IConsoleOutput} output The output.
   */
  const outputToConsole = (output: IConsoleOutput): void => {
    // mission.outputToConsole(output)
  }

  /**
   * Handles the selection of a node in the mission map by the user.
   * @param {ClientMissionNode} node The node that was selected.
   */
  const onNodeSelect = async (node: ClientMissionNode): Promise<void> => {
    // If the join method is 'supervisor', abort
    // selection handling.
    if (game.joinMethod === 'supervisor') {
      return
    }

    // Logic to send the pre-execution text to the output panel.
    if (node.preExecutionText !== '' && node.preExecutionText !== null) {
      let output: IConsoleOutput = OutputPanel.renderPreExecutionOutput(node)
      outputToConsole(output)
    }

    // Logic that opens the next level of nodes
    // (displays the selected node's child nodes)
    if (node.openable) {
      game.openNode(node._id, {
        onError: (message) => handleError({ message, notifyMethod: 'bubble' }),
      })
    }
    // If the node is ready to execute...
    else if (node.readyToExecute) {
      // If there are no more resources left
      // to spend, notify the user.
      if (game.resources === 0) {
        notify(`You have no more resources left to spend.`)
      }
      // If there is not enough resources to
      // execute any actions, notify the user.
      else if (
        !MapToolbox.mapToArray(
          node.actions,
          (action) => action.resourceCost <= game.resources,
        ).includes(true)
      ) {
        notify(`You do not have enough resources to execute any actions.`)
      }
      // Else, select the node.
      else {
        setNodeToExecute(node)
      }
    }
  }

  /**
   * Callback for the end game button.
   */
  const onClickEndGame = async () => {
    // If the game is not started, verify navigation.
    if (game.state !== 'started') {
      verifyNavigation.current()
      return
    }

    // Confirm the user wants to end the game.
    let { choice } = await prompt(
      'Please confirm ending the game.',
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
      beginLoading('Ending game...')
      // Start the game.
      await game.$end()
      // Redirect to game page.
      navigateTo('HomePage', {}, { bypassMiddleware: true })
    } catch (error) {
      handleError({
        message: 'Failed to end game.',
        notifyMethod: 'bubble',
      })
    }
  }

  /**
   * Redirects to the correct page based on
   * the game state. Stays on the same page
   * if the game is started and not ended.
   */
  const verifyNavigation = useRef(() => {
    // If the game is unstarted, navigate to the lobby page.
    if (game.state === 'unstarted') {
      navigateTo('LobbyPage', { game }, { bypassMiddleware: true })
    }
    // If the game is ended, navigate to the home page.
    if (game.state === 'ended') {
      navigateTo('HomePage', {}, { bypassMiddleware: true })
    }
  })

  /* -- computed -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(() => {
    let links: TWithKey<TButtonText>[] = []

    // Push end game button, if user is authorized.
    if (
      session.user.isAuthorized('games_join_manager') ||
      session.user.isAuthorized('games_join_observer')
    ) {
      links.push({ key: 'end-game', text: 'End Game', onClick: onClickEndGame })
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
    let classList: string[] = ['GamePage', 'Page']

    // Add the join method to the class list.
    classList.push(game.joinMethod)

    // Return the class list as a joined string.
    return classList.join(' ')
  })

  /**
   * The class name for the resources element.
   */
  const resourcesClass = compute(() => {
    // Define default list.
    let resourcesClassList: string[] = ['Resources']

    // If resources are not infinite, and the mission
    // has no resources left, add the red alert
    // class to the resources.
    if (!game.config.infiniteResources && game.resources <= 0) {
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
        tooltipDescription: 'Open output panel.',
        onClick: () => {
          setRightPanelTab('output')
        },
      })
    }

    // Return the buttons.
    return buttons
  })

  /* -- effects -- */

  // Verify navigation on mount and on game state change.
  useMountHandler((done) => {
    finishLoading()
    verifyNavigation.current()
    done()
  })
  useEventListener(server, 'game-state-change', () =>
    verifyNavigation.current(),
  )

  // Add navigation middleware to properly
  // quit the game before the user navigates
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
        await game.$quit()
        next()
      } catch (error) {
        handleError({
          message: 'Failed to quit game.',
          notifyMethod: 'bubble',
        })
      }
    }
  })

  // Update the resources when an action is executed.
  useEventListener(server, 'action-execution-initiated', () => {
    setResources(game.resources)
  })

  /* -- pre-rendering-processing -- */

  // If the aspect ratio is greater than or equal to 16:9,
  // and the window width is greater than or equal to 1850px,
  // then the default size of the output panel will be 40%
  // of the width of the window.
  if (currentAspectRatio >= 16 / 9 && window.innerWidth >= 1850) {
    panel2DefaultSize = window.innerWidth * 0.4
  }

  /* -- render -- */

  /**
   * JSX for the top bar element.
   */
  const topBarJsx = compute((): JSX.Element | null => {
    return (
      <div className='TopBar'>
        <div className={resourcesClass}>
          Resources:{' '}
          {game.config.infiniteResources ? (
            <span className='Count Infinite'>ထ</span>
          ) : (
            <span className='Count Finite'>
              {resources} / {mission.initialResources}
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
          game={game}
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
                onNodeSelect={onNodeSelect}
                overlayContent={overlayContentJsx}
                customButtons={customButtons}
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
                  return <OutputPanel mission={mission} />
                case 'users':
                  return <UsersPanel game={game} key={'users-panel'} />
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
 * Prop type for `GamePage`.
 */
export interface TGamePage_P extends TPage_P {
  /**
   * The game client to use on the page.
   */
  game: GameClient
}

/**
 * Available tabs for the right panel on the game page.
 */
export type TGameRightPanelTab = 'output' | 'users'
