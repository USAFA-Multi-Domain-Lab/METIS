import { useState } from 'react'
import { IConsoleOutput } from 'src/components/content/game/ConsoleOutput'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import GameClient from 'src/games'
import ClientMission from 'src/missions'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { useEventListener, useMountHandler } from 'src/toolbox/hooks'
import { DefaultLayout, TPage_P } from '.'
import MapToolbox from '../../../../shared/toolbox/maps'
import OutputPanel from '../content/game/OutputPanel'
import StatusBar from '../content/game/StatusBar'
import MissionMap from '../content/game/mission-map'
import ActionExecModal from '../content/game/mission-map/ui/overlay/modals/ActionExecModal'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import './GamePage.scss'

export interface IGamePage extends TPage_P {
  game: GameClient
}

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function GamePage(props: IGamePage): JSX.Element | null {
  /* -- props -- */

  let game: GameClient = props.game
  let mission: ClientMission = game.mission

  console.log(game.gameID)

  /* -- global-context -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const { navigateTo, finishLoading, notify, logout, confirm, handleError } =
    globalContext.actions

  /* -- state -- */

  const [nodeToExecute, setNodeToExecute] = useState<ClientMissionNode | null>(
    null,
  )
  const [resources, setResources] = useState<number>(game.resources)

  /* -- variables -- */

  // Class names for various components.
  let rootClassList: string[] = ['GamePage', 'Page']
  // Dynamic (default) sizing of the output panel.
  let panel2DefaultSize: number = 400
  // The current aspect ratio of the window.
  let currentAspectRatio: number = window.innerWidth / window.innerHeight

  /* -- computed -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(() => ({
    links: [
      {
        text: 'Quit',
        key: 'quit',
        onClick: () => {
          navigateTo('HomePage', {})
        },
      },
    ],
    logoLinksHome: false,
  }))

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
    // Logic to send the pre-execution text to the output panel.
    if (node.preExecutionText !== '' && node.preExecutionText !== null) {
      let output: IConsoleOutput = OutputPanel.renderPreExecutionOutput(node)
      outputToConsole(output)
    }

    // Logic that opens the next level of nodes
    // (displays the selected node's child nodes)
    if (node.openable) {
      try {
        game.openNode(node.nodeID)
      } catch (error) {
        handleError({
          message: 'Unexpected error opening node.',
          notifyMethod: 'bubble',
        })
      }
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

  /* -- effects -- */

  useMountHandler((done) => {
    finishLoading()
    done()
  })

  // Add navigation middleware to properly
  // quit the game before the user navigates
  // away.
  useNavigationMiddleware((to, next) => {
    confirm(
      'Are you sure you want to quit?',
      async (concludeAction: () => void) => {
        try {
          await game.$quit()
          concludeAction()
          next()
        } catch (error) {
          handleError({
            message: 'Failed to quit game.',
            notifyMethod: 'bubble',
          })
          concludeAction()
        }
      },
      {
        buttonConfirmText: 'Yes',
        buttonCancelText: 'No',
      },
    )
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
    <div className={rootClassList.join(' ')}>
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
              />
            ),
          }}
          panel2={{
            ...ResizablePanel.defaultProps,
            minSize: 400,
            isOpen: true,
            render: () => <OutputPanel mission={mission} />,
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
export interface IGamePage extends TPage_P {
  /**
   * The game client to use on the page.
   */
  game: GameClient
}
