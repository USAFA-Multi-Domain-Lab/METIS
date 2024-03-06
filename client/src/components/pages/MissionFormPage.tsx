import { useEffect, useState } from 'react'
import { useBeforeunload } from 'react-beforeunload'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionNode, { ENodeDeleteMethod } from 'src/missions/nodes'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import MissionAction from '../../../../shared/missions/actions'
import { IPage } from '../App'
import ActionEntry from '../content/edit-mission/ActionEntry'
import MissionEntry from '../content/edit-mission/MissionEntry'
import NodeEntry from '../content/edit-mission/NodeEntry'
import NodeStructuring from '../content/edit-mission/NodeStructuring'
import EffectEntry from '../content/edit-mission/target-effects/EffectEntry'
import MissionMap from '../content/game/MissionMap'
import Navigation from '../content/general-layout/Navigation'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import './MissionFormPage.scss'

/**
 * This will render page that allows the user to
 * edit a mission.
 */
export default function MissionFormPage(
  props: IMissionFormPage,
): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const [notifications] = globalContext.notifications
  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    goToPage,
    confirm,
    logout,
    forceUpdate,
  } = globalContext.actions

  /* -- STATE -- */

  const [mission, setMission] = useState<ClientMission>(new ClientMission())
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [selectedNode, setSelectedNode] = useState<ClientMissionNode | null>(
    null,
  )
  const [selectedAction, setSelectedAction] =
    useState<ClientMissionAction | null>(null)
  const [selectedEffect, setSelectedEffect] = useState<ClientEffect | null>(
    null,
  )
  const [nodeStructuringIsActive, activateNodeStructuring] =
    useState<boolean>(false)
  const [missionEmptyStringArray, setMissionEmptyStringArray] = useState<
    string[]
  >([])
  const [nodeEmptyStringArray, setNodeEmptyStringArray] = useState<string[]>([])
  const [actionEmptyStringArray, setActionEmptyStringArray] = useState<
    string[]
  >([])
  const [effectEmptyStringArray, setEffectEmptyStringArray] = useState<
    string[]
  >([])
  const [missionPath, setMissionPath] = useState<string[]>([])
  const [targetEnvironments, setTargetEnvironments] = useState<
    ClientTargetEnvironment[]
  >([])

  /* -- COMPUTED -- */
  /**
   * Determines whether or not to show the mission details.
   */
  const missionDetailsIsActive: boolean = compute(
    () => selectedNode === null && !nodeStructuringIsActive,
  )
  /**
   * Determines if any of the fields are empty.
   */
  const isEmptyString: boolean = compute(
    () =>
      missionEmptyStringArray.length > 0 ||
      nodeEmptyStringArray.length > 0 ||
      actionEmptyStringArray.length > 0 ||
      effectEmptyStringArray.length > 0,
  )
  /**
   * This determines if there are any of the properties are default values.
   */
  const areDefaultValues: boolean = compute(() => {
    let areDefaultValues: boolean = false
    let missionHasDefaultValues: boolean = false
    let nodeHasDefaultValues: boolean = false
    let actionHasDefaultValues: boolean = false
    let effectHasDefaultValues: boolean = false

    // Check if the mission has default values.
    if (
      mission.name === ClientMission.DEFAULT_PROPERTIES.name ||
      mission.introMessage === ClientMission.DEFAULT_PROPERTIES.introMessage
    ) {
      // todo: remove comment after updating the mission class
      // missionHasDefaultValues = true
    }

    // Check if the selected node has default values.
    if (selectedNode) {
      if (selectedNode.name === ClientMissionNode.DEFAULT_PROPERTIES.name) {
        // todo: remove comment after updating the node class
        // nodeHasDefaultValues = true
      }
    }

    // Check if the selected action has default values.
    if (selectedAction) {
      if (
        selectedAction.name === MissionAction.DEFAULT_PROPERTIES.name ||
        selectedAction.description ===
          MissionAction.DEFAULT_PROPERTIES.description ||
        selectedAction.successChance ===
          MissionAction.DEFAULT_PROPERTIES.successChance ||
        selectedAction.processTime ===
          MissionAction.DEFAULT_PROPERTIES.processTime ||
        selectedAction.resourceCost ===
          MissionAction.DEFAULT_PROPERTIES.resourceCost ||
        selectedAction.postExecutionSuccessText ===
          MissionAction.DEFAULT_PROPERTIES.postExecutionSuccessText ||
        selectedAction.postExecutionFailureText ===
          MissionAction.DEFAULT_PROPERTIES.postExecutionFailureText
      ) {
        // todo: remove comment after updating the action class
        // actionHasDefaultValues = true
      }
    }

    // Check if the selected effect has default values.
    if (selectedEffect) {
      if (
        selectedEffect.name === undefined ||
        selectedEffect.description === undefined ||
        selectedEffect.target === undefined
      ) {
        effectHasDefaultValues = true
      }
    }

    // If any of the properties have default values,
    // then set areDefaultValues to true.
    if (
      missionHasDefaultValues ||
      nodeHasDefaultValues ||
      actionHasDefaultValues ||
      effectHasDefaultValues
    ) {
      areDefaultValues = true
    }

    return areDefaultValues
  })
  /**
   * Determines whether or not to gray out the save button.
   */
  const grayOutSaveButton: boolean = compute(
    () => !areUnsavedChanges || isEmptyString || areDefaultValues,
  )
  /**
   * Determines whether or not to gray out the edit button.
   */
  const grayOutEditButton: boolean = compute(
    () => nodeStructuringIsActive || isEmptyString || areDefaultValues,
  )
  /**
   * Determines whether or not to gray out the deselect node button.
   */
  const grayOutDeselectNodeButton: boolean = compute(
    () => isEmptyString || areDefaultValues,
  )
  /**
   * Determines whether or not to gray out the add node button.
   */
  const grayOutAddNodeButton: boolean = compute(
    () => isEmptyString || areDefaultValues,
  )
  /**
   * Determines whether or not to gray out the delete node button.
   */
  const grayOutDeleteNodeButton: boolean = compute(() => mission.nodes.size < 2)
  /**
   * Default size of the output panel.
   */
  const panel2DefaultSize: number = compute(() => {
    let panel2DefaultSize: number = 330 /*px*/
    let currentAspectRatio: number = window.innerWidth / window.innerHeight

    // If the aspect ratio is greater than or equal to 16:9,
    // and the window width is greater than or equal to 1850px,
    // then the default size of the output panel will be 40%
    // of the width of the window.
    if (currentAspectRatio >= 16 / 9 && window.innerWidth >= 1850) {
      panel2DefaultSize = window.innerWidth * 0.4
    }

    return panel2DefaultSize
  })

  /* -- EFFECTS -- */

  useMountHandler(async (done) => {
    let missionID: string | null = props.missionID

    // Handle the editing of an existing mission.
    if (missionID !== null) {
      try {
        beginLoading('Loading mission...')
        let mission: ClientMission = await ClientMission.fetchOne(missionID, {
          openAll: true,
        })
        setMission(mission)
        setMissionPath([mission.name])
        setTargetEnvironments(await ClientTargetEnvironment.fetchAll())
      } catch {
        handleError('Failed to load mission.')
      }
    }

    // Finish loading.
    finishLoading()
    // Mark mount as handled.
    done()
  })

  // Guards against refreshing or navigating away
  // with unsaved changes.
  useBeforeunload((event) => {
    if (areUnsavedChanges) {
      event.preventDefault()
    }
  })

  // If the selected node changes, then the mission
  // path is updated and it will reset the selected
  // action and effect.
  useEffect(() => {
    if (selectedNode === null) {
      setMissionPath([mission.name])
    } else {
      setMissionPath([mission.name, selectedNode.name])
    }
    setSelectedAction(null)
    setSelectedEffect(null)
  }, [selectedNode])

  // If the selected action changes, then the mission
  // path will be updated and it will reset the selected
  // effect.
  useEffect(() => {
    if (selectedNode && selectedAction === null) {
      setMissionPath([mission.name, selectedNode.name])
    } else if (selectedNode && selectedAction) {
      setMissionPath([
        mission.name,
        selectedNode.name,
        selectedAction.name || '',
      ])
    } else if (selectedNode === null) {
      setMissionPath([mission.name])
    }

    setSelectedEffect(null)
  }, [selectedAction])

  // If the selected effect changes, then the mission
  // path will be updated.
  useEffect(() => {
    if (selectedNode && selectedAction && selectedEffect) {
      setMissionPath([
        mission.name,
        selectedNode.name,
        selectedAction.name || '',
        selectedEffect.name || '',
      ])
    } else if (selectedNode && selectedAction) {
      setMissionPath([
        mission.name,
        selectedNode.name,
        selectedAction.name || '',
      ])
    } else if (selectedNode === null) {
      setMissionPath([mission.name])
    }
  }, [selectedEffect])

  /* -- FUNCTIONS -- */

  // This is called when a change is
  // made that would require saving.
  const handleChange = (): void => {
    setAreUnsavedChanges(true)

    if (mission.nodeCreationTarget !== null && selectedNode !== null) {
      mission.nodeCreationTarget = null
    }

    forceUpdate()
  }

  // This will select or unselect a node
  const selectNode = (node: ClientMissionNode | null) => {
    if (selectedNode !== null) {
      mission.nodeCreationTarget = null
    }

    if (node) {
      missionPath.push(node.name)
    }

    setSelectedNode(node)
    activateNodeStructuring(false)
    setMissionEmptyStringArray([])
    setNodeEmptyStringArray([])
    setActionEmptyStringArray([])
    setEffectEmptyStringArray([])
  }

  /**
   * Saves the mission to the server with
   * any changes made.
   * @returns A promise that resolves when the mission has been saved.
   */
  const save = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (areUnsavedChanges) {
          // Set unsaved changes to false to
          // prevent multiple saves.
          setAreUnsavedChanges(false)
          // Save the mission and notify
          // the user.
          await mission.saveToServer()
          notify('Mission successfully saved.')
        }
        resolve()
      } catch (error) {
        // Notify and revert upon error.
        notify('Mission failed to save')
        setAreUnsavedChanges(true)
        reject(error)
      }
    })
  }

  // If a node is deleted, and no remain
  // in the mission, one is auto-generated.
  // If this has happened, the user is
  // notified here.
  const ensureOneNodeExists = (): void => {
    if (
      mission.nodes.size === 1 &&
      mission.lastCreatedNode?.nodeID ===
        Array.from(mission.nodes.values())[0].nodeID
    ) {
      notify(
        'Auto-generated a node for this mission, since missions must have at least one node.',
      )
    }
  }

  // If a node is selected and is executable,
  // this ensures that at least on action
  // exists.
  const ensureOneActionExistsIfExecutable = (): void => {
    if (
      selectedNode !== null &&
      selectedNode.executable &&
      selectedNode.actions.size === 0
    ) {
      // Checks to make sure the selected node has at least
      // one action to choose from. If the selected node doesn't
      // have at least one action then it will auto-generate one
      // for that node.
      let newAction: ClientMissionAction = new ClientMissionAction(selectedNode)
      selectedNode.actions.set(newAction.actionID, newAction)

      notify(
        `Auto-generated an action for ${selectedNode.name} because it is an executable node with no actions to execute.`,
      )

      handleChange()
    }
  }

  // This is called when a node is
  // requested to be deleted.
  const handleNodeDeleteRequest = (): void => {
    if (selectedNode !== null) {
      if (selectedNode.hasChildren) {
        confirm(
          `**Note: This node has children** \n` +
            `Please confirm if you would like to delete "${selectedNode.name}" only or "${selectedNode.name}" and all of it's children.`,
          (concludeAction: () => void) => {
            selectedNode.delete({
              deleteMethod: ENodeDeleteMethod.DeleteNodeAndChildren,
            })
            handleChange()
            activateNodeStructuring(false)
            selectNode(null)
            ensureOneNodeExists()
            concludeAction()
          },
          {
            handleAlternate: (concludeAction: () => void) => {
              selectedNode.delete({
                deleteMethod: ENodeDeleteMethod.DeleteNodeAndShiftChildren,
              })
              handleChange()
              activateNodeStructuring(false)
              selectNode(null)
              ensureOneNodeExists()
              concludeAction()
            },
            buttonConfirmText: `Node + Children`,
            buttonAlternateText: `Node`,
          },
        )
      } else {
        confirm(
          'Please confirm the deletion of this node.',
          (concludeAction: () => void) => {
            selectedNode.delete()
            handleChange()
            activateNodeStructuring(false)
            selectNode(null)
            ensureOneNodeExists()
            concludeAction()
          },
        )
      }
    }
  }

  /**
   * Handler for when the user requests to add a new node.
   */
  const handleNodeAddRequest = (): void => {
    if (selectedNode !== null) {
      mission.nodeCreationTarget = selectedNode
    }
  }

  // This verifies that node selection
  // is able to change.
  const validateNodeSelectionChange = (
    onValid: () => void,
    onInvalid: () => void = () => {},
  ): void => {
    if (
      missionDetailsIsActive &&
      missionEmptyStringArray.length > 0 &&
      areDefaultValues
    ) {
      notify(
        `**Error:** The mission side panel has at least one field that was left empty. This field must contain at least one character.`,
        { duration: null, errorMessage: true },
      )
      return onInvalid()
    }
    if (selectedNode && nodeEmptyStringArray.length > 0 && areDefaultValues) {
      notify(
        `**Error:** The node called "${selectedNode.name.toLowerCase()}" has at least one field that was left empty. These fields must contain at least one character.`,
        { duration: null, errorMessage: true },
      )
      return onInvalid()
    }
    if (
      selectedAction &&
      effectEmptyStringArray.length > 0 &&
      areDefaultValues
    ) {
      notify(
        `**Error:** The selected action has at least one field that was left empty. These fields must contain at least one character.`,
        { duration: null, errorMessage: true },
      )
      return onInvalid()
    }
    if (
      selectedEffect &&
      effectEmptyStringArray.length > 0 &&
      areDefaultValues
    ) {
      notify(
        `**Error:** The selected effect has at least one field that was left empty. These fields must contain at least one character.`,
        { duration: null, errorMessage: true },
      )
      return onInvalid()
    }
    return onValid()
  }

  // This will redirect the user to the
  // home page.
  const goHome = (): void => {
    if (!areUnsavedChanges) {
      goToPage('HomePage', {})
    } else {
      confirm(
        'You have unsaved changes. What do you want to do with them?',
        async (concludeAction: () => void) => {
          await save().catch(() => {})
          goToPage('HomePage', {})
          concludeAction()
        },
        {
          handleAlternate: (concludeAction: () => void) => {
            goToPage('HomePage', {})
            concludeAction()
          },
          pendingMessageUponConfirm: 'Saving...',
          pendingMessageUponAlternate: 'Discarding...',
          buttonConfirmText: 'Save',
          buttonAlternateText: 'Discard',
        },
      )
    }
  }

  // This will redirect the user to the
  // game page.
  const goToGamePage = (): void => {
    if (!areUnsavedChanges) {
      goToPage('GamePage', {
        missionID: mission.missionID,
      })
    } else {
      confirm(
        'You have unsaved changes. What do you want to do with them?',
        async (concludeAction: () => void) => {
          await save().catch(() => {})
          goToPage('GamePage', {})
          concludeAction()
        },
        {
          handleAlternate: (concludeAction: () => void) => {
            goToPage('GamePage', {
              missionID: mission.missionID,
            })
            concludeAction()
          },
          pendingMessageUponConfirm: 'Saving...',
          pendingMessageUponAlternate: 'Discarding...',
          buttonConfirmText: 'Save',
          buttonAlternateText: 'Discard',
        },
      )
    }
  }

  /* -- PRE-RENDER PROCESSING -- */

  // If all fields are filled in, then make sure
  // any notifications are dismissed after 2 seconds.
  if (!isEmptyString) {
    for (let notification of notifications) {
      if (notification.errorMessage) {
        setTimeout(() => {
          notification.dismiss()
        }, 2000)
      }
    }
  }

  /* -- RENDER -- */

  return (
    <div className={'MissionFormPage Page'}>
      {/* -- NAVIGATION */}
      <Navigation
        links={[
          {
            text: 'Done',
            handleClick: goHome,
            visible: true,
            key: 'done',
          },
          {
            text: 'Play test',
            handleClick: goToGamePage,
            visible: true,
            key: 'play-test',
          },
          {
            text: 'Log out',
            handleClick: () =>
              logout({
                returningPagePath: 'HomePage',
                returningPageProps: {},
              }),
            visible: true,
            key: 'log-out',
          },
        ]}
        brandingCallback={goHome}
        brandingTooltipDescription='Go home.'
      />

      {/* -- CONTENT -- */}
      <div className='Content'>
        <PanelSizeRelationship
          panel1={{
            ...ResizablePanel.defaultProps,
            minSize: 330,
            render: () => (
              <MissionMap
                mission={mission}
                missionAjaxStatus={'Loaded'}
                selectedNode={selectedNode}
                allowCreationMode={true}
                handleNodeSelection={(node: ClientMissionNode) => {
                  validateNodeSelectionChange(() => {
                    selectNode(node)
                    ensureOneActionExistsIfExecutable()
                  })
                }}
                handleNodeCreation={(node: ClientMissionNode) => {
                  setSelectedNode(node)
                  handleChange()
                }}
                handleNodeDeselection={() => {
                  validateNodeSelectionChange(() => {
                    selectNode(null)
                  })
                }}
                handleNodeDeletionRequest={handleNodeDeleteRequest}
                handleMapEditRequest={() => {
                  selectNode(null)
                  activateNodeStructuring(true)
                }}
                handleMapSaveRequest={save}
                grayOutEditButton={grayOutEditButton}
                grayOutSaveButton={grayOutSaveButton}
                grayOutDeselectNodeButton={grayOutDeselectNodeButton}
                grayOutAddNodeButton={grayOutAddNodeButton}
                grayOutDeleteNodeButton={grayOutDeleteNodeButton}
                applyNodeClassName={(node: ClientMissionNode) => ''}
                renderNodeTooltipDescription={(node: ClientMissionNode) => ''}
              />
            ),
          }}
          panel2={{
            ...ResizablePanel.defaultProps,
            minSize: 330,
            render: () => {
              if (missionDetailsIsActive) {
                return (
                  <MissionEntry
                    active={missionDetailsIsActive}
                    mission={mission}
                    missionPath={missionPath}
                    missionEmptyStringArray={missionEmptyStringArray}
                    setMissionEmptyStringArray={setMissionEmptyStringArray}
                    setMissionPath={setMissionPath}
                    handleChange={handleChange}
                  />
                )
              } else if (
                selectedNode &&
                selectedAction === null &&
                selectedEffect === null
              ) {
                return (
                  <NodeEntry
                    node={selectedNode}
                    missionPath={missionPath}
                    isEmptyString={isEmptyString}
                    nodeEmptyStringArray={nodeEmptyStringArray}
                    setNodeEmptyStringArray={setNodeEmptyStringArray}
                    setMissionPath={setMissionPath}
                    selectNode={selectNode}
                    setSelectedAction={setSelectedAction}
                    handleChange={handleChange}
                    handleAddRequest={handleNodeAddRequest}
                    handleDeleteRequest={handleNodeDeleteRequest}
                  />
                )
              } else if (
                selectedNode &&
                selectedAction &&
                selectedEffect === null
              ) {
                return (
                  <ActionEntry
                    action={selectedAction}
                    missionPath={missionPath}
                    isEmptyString={isEmptyString}
                    areDefaultValues={areDefaultValues}
                    actionEmptyStringArray={actionEmptyStringArray}
                    setActionEmptyStringArray={setActionEmptyStringArray}
                    setMissionPath={setMissionPath}
                    selectNode={selectNode}
                    setSelectedAction={setSelectedAction}
                    setSelectedEffect={setSelectedEffect}
                    handleChange={handleChange}
                  />
                )
              } else if (selectedNode && selectedAction && selectedEffect) {
                return (
                  <EffectEntry
                    action={selectedAction}
                    effect={selectedEffect}
                    missionPath={missionPath}
                    targetEnvironments={targetEnvironments}
                    isEmptyString={isEmptyString}
                    areDefaultValues={areDefaultValues}
                    effectEmptyStringArray={effectEmptyStringArray}
                    setEffectEmptyStringArray={setEffectEmptyStringArray}
                    setMissionPath={setMissionPath}
                    selectNode={selectNode}
                    setSelectedAction={setSelectedAction}
                    setSelectedEffect={setSelectedEffect}
                    handleChange={handleChange}
                  />
                )
              } else if (nodeStructuringIsActive) {
                return (
                  <NodeStructuring
                    active={nodeStructuringIsActive}
                    mission={mission}
                    handleChange={handleChange}
                    handleCloseRequest={() => activateNodeStructuring(false)}
                  />
                )
              } else {
                return null
              }
            },
          }}
          sizingMode={EPanelSizingMode.Panel1_Auto__Panel2_Defined}
          initialDefinedSize={panel2DefaultSize}
        />
      </div>

      {/* -- FOOTER -- */}
      <div className='FooterContainer'>
        <a
          href='https://www.midjourney.com/'
          className='Credit'
          draggable={false}
        >
          Photo by Midjourney
        </a>
      </div>
    </div>
  )
}

export interface IMissionFormPage extends IPage {
  /**
   * The ID of the mission to be edited. If null,
   * a new mission is being created.
   */
  missionID: string | null
}
