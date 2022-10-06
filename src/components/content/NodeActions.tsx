import React, { useState } from 'react'
import './NodeActions.scss'
import { useStore } from 'react-context-hook'
import { Mission, MissionNode } from '../../modules/missions'
import usersModule, { IUser } from '../../modules/users'
import gameLogic from '../../modules/game-logic'
import NodeStructureReference from '../../modules/node-reference'

const NodeActions = (props: {
  name: string | undefined
  selectedNode: MissionNode | null | undefined
  missionState: NodeStructureReference
}) => {
  /* -- GLOBAL STATE -- */
  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')
  const [nodeActionWindowIsDisplayed, setNodeActionWindowIsDisplayed] =
    useStore<boolean>('nodeActionWindowIsDisplayed')

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)

  /* -- COMPONENT FUNCTIONS -- */

  // This forces a rerender of the component.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // Closes the execution prompt window
  const cancelExecution = (): void => {
    setNodeActionWindowIsDisplayed(false)
  }

  const attack = () => {
    setNodeActionWindowIsDisplayed(false)

    if (currentUser !== null) {
      let username: string = currentUser.userID

      if (props.selectedNode !== undefined && props.selectedNode !== null) {
        if (props.selectedNode._willSucceed === true) {
          gameLogic.handleNodeSelection(props.selectedNode, props.missionState)
          forceUpdate()

          setConsoleOutputs([
            ...consoleOutputs,
            {
              date: Date.now(),
              value: `<span class='line-cursor'>${username}@USAFA: </span>
                       <span class = ${props.selectedNode.color}>${props.selectedNode.postExecutionSuccessText}</span>`,
            },
          ])
        } else {
          forceUpdate()
          setConsoleOutputs([
            ...consoleOutputs,
            {
              date: Date.now(),
              value: `<span class='line-cursor'>${username}@USAFA: </span>
                      <span class = ${props.selectedNode.color}>${props.selectedNode.postExecutionFailureText}</span>`,
            },
          ])
        }
      }
    }
  }

  const defend = () => {
    setNodeActionWindowIsDisplayed(false)

    if (currentUser !== null) {
      let username: string = currentUser.userID

      if (props.selectedNode !== undefined && props.selectedNode !== null) {
        if (props.selectedNode._willSucceed === true) {
          gameLogic.handleNodeSelection(props.selectedNode, props.missionState)
          forceUpdate()

          setConsoleOutputs([
            ...consoleOutputs,
            {
              date: Date.now(),
              value: `<span class='line-cursor'>${username}@USAFA: </span>
                       <span class = ${props.selectedNode.color}>${props.selectedNode.postExecutionSuccessText}</span>`,
            },
          ])
        } else {
          forceUpdate()
          setConsoleOutputs([
            ...consoleOutputs,
            {
              date: Date.now(),
              value: `<span class='line-cursor'>${username}@USAFA: </span>
                      <span class = ${props.selectedNode.color}>${props.selectedNode.postExecutionFailureText}</span>`,
            },
          ])
        }
      }
    }
  }

  return (
    <div className='NodeActions'>
      <li className='x' onClick={cancelExecution}>
        x
      </li>

      <li className='PromptDisplayText'>
        Do you want to execute {props.name}?
      </li>
      <div className='ButtonOptions'>
        <button className='AttackButton' onClick={attack}>
          Attack
        </button>
        <button className='DefendButton' onClick={defend}>
          Defend
        </button>
      </div>
    </div>
  )
}

export default NodeActions
