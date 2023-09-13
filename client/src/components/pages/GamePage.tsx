import { useEffect, useState } from 'react'
import Mission from '../../../../shared/missions'
import { EAjaxStatus } from '../../../../shared/toolbox/ajax'
import MissionMap from '../content/game/MissionMap'
import OutputPanel from '../content/game/OutputPanel'
import './GamePage.scss'
import ExecuteNodePath from '../content/game/ExecuteNodePath'
import NodeActions from '../content/game/NodeActions'
import { IPage } from '../App'
import MissionNode from '../../../../shared/missions/nodes'
import Navigation from '../content/general-layout/Navigation'
import MissionModificationPanel from '../content/user-controls/MissionModificationPanel'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import MissionAction from '../../../../shared/missions/actions'
import { IConsoleOutput } from 'src/components/content/game/ConsoleOutput'
import GameClient from 'src/games'
import { useGlobalContext } from 'src/context'
import { useMountHandler } from 'src/toolbox/hooks'

export interface IGamePage extends IPage {
  game: GameClient
}

// This is the number of times per
// second that the game updates.
const GAME_TICK_RATE: number = 20

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function GamePage(props: IGamePage): JSX.Element | null {
  /* -- PROPS -- */

  let game: GameClient = props.game
  let mission: Mission = game.mission

  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { goToPage, finishLoading, notify, logout, forceUpdate, confirm } =
    globalContext.actions

  /* -- STATE -- */

  const [selectedNode, selectNode] = useState<MissionNode | null>(null)
  const [selectedAction, selectAction] = useState<MissionAction | null>(null)

  /* -- VARIABLES -- */

  // Variables that determine whether or not
  // to display various components.
  let displayNodeActions: boolean =
    selectedNode !== null && selectedAction === null
  let displayExecuteNodePath: boolean =
    selectedNode !== null && selectedAction !== null

  // Class names for various components.
  let className: string = 'GamePage Page'
  let resourcesClassName: string = 'Resources'

  /* -- FUNCTIONS -- */

  // This will loop the game,
  // updating at the given tick
  // rate.
  let loop: () => void = () => {
    setTimeout(() => {
      try {
        forceUpdate()
        loop()
      } catch (error) {}
    }, 1000 / GAME_TICK_RATE)
  }

  /**
   * Outputs to the in-browser console.
   * @param {IConsoleOutput} output The output.
   */
  const outputToConsole = (output: IConsoleOutput): void => {
    mission.outputToConsole(output)
  }

  /**
   * Handles the selection of a node in the mission map by the user.
   * @param {MissionNode} node The node that was selected.
   */
  const handleNodeSelection = async (node: MissionNode): Promise<void> => {
    // Logic to send the pre-execution text to the output panel.
    if (node.preExecutionText !== '' && node.preExecutionText !== null) {
      let output: IConsoleOutput = OutputPanel.renderPreExecutionOutput(node)
      outputToConsole(output)
    }

    // Logic that opens the next level of nodes
    // (displays the selected node's child nodes)
    if (node.openable) {
      game.openNode(node.nodeID)
    }

    // If the node is ready to execute...
    else if (node.readyToExecute) {
      // If there are no more resources left
      // to spend, notify the user.
      if (mission.resources === 0) {
        notify(`You have no more resources left to spend.`)
      }
      // If there is not enough resources to
      // execute any actions, notify the user.
      else if (
        !node.actions
          .map((action) => action.resourceCost <= mission.resources)
          .includes(true)
      ) {
        notify(`You do not have enough resources to execute any actions.`)
      }
      // Else, select the node.
      else {
        selectNode(node)

        // If the node has only one action,
        // preelect that action as well.
        if (node.actions.length === 1) {
          selectAction(node.actions[0])
        }

        // Force a state update.
        forceUpdate()
      }
    }
  }

  /**
   * Clears the selected node and action.
   */
  const clearSelections = (): void => {
    selectNode(null)
    selectAction(null)
  }

  // This will render the execute node path
  // prompt if the user has selected a node
  // and an action.
  const renderExecuteNodePath = () => {
    if (selectedNode !== null && selectedAction !== null) {
      return (
        <ExecuteNodePath
          selectedAction={selectedAction}
          isOpen={displayExecuteNodePath}
          outputToConsole={outputToConsole}
          handleExecutionRequest={() => {
            if (selectedAction) {
              game.executeAction(selectedAction.actionID)
            }
          }}
          handleCloseRequest={clearSelections}
          handleGoBackRequest={() => {
            if (selectedNode && selectedNode.actions.length === 1) {
              clearSelections()
            }
          }}
          notify={notify}
        />
      )
    }
  }

  /* -- EFFECTS -- */

  useMountHandler((done) => {
    finishLoading()
    loop()
    done()
  })

  // Equivalent of componentWillUnmount.
  useEffect(() => {
    return () => {
      loop = () => {}
    }
  }, [])

  /* -- PRE-RENDER-PROCESSING -- */

  // If the mission has no resources left,
  // add the red alert class to the resources.
  if (mission.resources <= 0) {
    resourcesClassName += ' RedAlert'
  }

  /* -- RENDER -- */

  // Return the rendered component.
  return (
    <div className={className}>
      {
        // -- navigation --
      }
      <Navigation
        links={[
          {
            text: 'Back to selection',
            key: 'back-to-selection',
            handleClick: () => {
              goToPage('HomePage', {})
            },
            visible: true,
          },
          {
            text: 'Log out',
            key: 'log-out',
            handleClick: () =>
              logout({
                returningPagePath: 'MissionSelectionPage',
                returningPageProps: {},
              }),
            visible: true,
          },
        ]}
        brandingCallback={() => goToPage('HomePage', {})}
        brandingTooltipDescription='Go home.'
      />
      {
        // -- content --
      }
      <div className='Content'>
        <div className='TopBar'>
          <div className={resourcesClassName}>
            Resources remaining: {mission.resources}
            <span style={{ display: 'inline-block', width: '40px' }}></span>
            Game ID: {game.gameID}
          </div>
        </div>

        <PanelSizeRelationship
          sizingMode={EPanelSizingMode.Panel1_Auto__Panel2_Defined}
          initialDefinedSize={400}
          panel1={{
            ...ResizablePanel.defaultProps,
            minSize: 400,
            render: () => (
              <>
                <MissionMap
                  mission={mission}
                  missionAjaxStatus={EAjaxStatus.Loaded}
                  handleNodeSelection={handleNodeSelection}
                  handleNodePathExitRequest={mission.enableAllNodes}
                  grayOutExitNodePathButton={!mission.hasDisabledNodes}
                  applyNodeClassName={(node: MissionNode) => {
                    let className: string = ''

                    if (node.isOpen) {
                      className += ' opened'
                    }

                    if (!node.highlighted) {
                      className += ' faded'
                    }

                    return className
                  }}
                  renderNodeTooltipDescription={(node: MissionNode) => {
                    let description: string = ''
                    let nodeActionDisplay = 'None selected'

                    // This creates the tooltip hover over effect
                    // that displays the description of the node
                    // prior to being executed.
                    if (node !== null && !node.executed && !node.executing) {
                      description = node.description
                    }

                    if (node.selectedAction !== null) {
                      nodeActionDisplay = node.selectedAction.name
                    }

                    // This creates the tooltip hover over effect
                    // that displays the description of the node
                    // after it has been executed.
                    if (node.executable && node.executed) {
                      description =
                        `* Action executed: "${node.selectedAction?.name}"\n` +
                        `* Executed node in ${
                          (node.selectedAction?.processTime as number) / 1000
                        } second(s)\n` +
                        `* Chance of success: ${
                          (node.selectedAction?.successChance as number) * 100
                        }%\n` +
                        `* Resources used: ${node.selectedAction?.resourceCost} resource(s)`
                    }

                    if (node.executing) {
                      description =
                        `* Time remaining: ${node.formatTimeRemaining(
                          false,
                        )} \n` + `* Description: ${node.description}`
                    }

                    return description
                  }}
                />
                <NodeActions
                  isOpen={displayNodeActions}
                  selectedNode={selectedNode}
                  handleActionSelectionRequest={selectAction}
                  handleCloseRequest={clearSelections}
                />
                {renderExecuteNodePath()}
              </>
            ),
          }}
          panel2={{
            ...ResizablePanel.defaultProps,
            minSize: 400,
            isOpen: true,
            render: () => <OutputPanel mission={mission} />,
          }}
        />
      </div>
    </div>
  )
}
