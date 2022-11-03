import React from 'react'
import { useStore, withStore } from 'react-context-hook'
import { Mission } from '../modules/missions'
import { MissionNode } from '../modules/mission-nodes'
import { MissionNodeAction } from '../modules/mission-node-actions'
import { IUser } from '../modules/users'
import { AnyObject } from 'mongoose'

/* -- constants -- */

export const tooltipsOffsetX = 50 /*px*/
export const tooltipsOffsetY = 35 /*px*/

/* -- interfaces -- */

interface IStateSetters {
  setTooltipDescription: (tooltipDescription: string) => void
}

/* -- classes -- */

// This is the global state used
// throught the application.
export default class GlobalState {
  currentUser: IUser | null
  currentPagePath: string
  currentPageProps: AnyObject
  appMountHandled: boolean
  stateSetters: IStateSetters
  loadingMinTimeReached: boolean
  loadingMessage: string | null
  lastLoadingMessage: string
  errorMessage: string | null
  tooltips: React.RefObject<HTMLDivElement>
  tooltipDescription: string
  consoleOutputs: Array<{ date: number; value: string }>
  notifications: Array<Notification>
  outputPanelIsDisplayed: boolean
  executeNodePathPromptIsDisplayed: boolean
  actionSelectionPromptIsDisplayed: boolean
  lastSelectedNode: MissionNode | null
  actionDisplay: Array<MissionNodeAction>
  actionName: string
  processTime: number
  actionSuccessChance: number
  mission: Mission | null
  allMissions: Array<Mission>

  constructor(stateSetters: IStateSetters) {
    this.currentUser = null
    this.currentPagePath = ''
    this.currentPageProps = {}
    this.appMountHandled = false
    this.stateSetters = stateSetters
    this.loadingMessage = 'Initializing application...'
    this.lastLoadingMessage = ''
    this.loadingMinTimeReached = false
    this.errorMessage = null
    this.tooltips = React.createRef()
    this.tooltipDescription = ''
    this.consoleOutputs = []
    this.notifications = []
    this.outputPanelIsDisplayed = false
    this.executeNodePathPromptIsDisplayed = false
    this.actionSelectionPromptIsDisplayed = false
    this.lastSelectedNode = null
    this.actionDisplay = []
    this.actionName = ''
    this.processTime = 0
    this.actionSuccessChance = 0
    this.mission = null
    this.allMissions = []
  }

  // This will position the currently
  // displayed tooltip in the state
  // to be relative to the mouse
  // position of the user.
  positionTooltip = (event: MouseEvent): void => {
    let tooltips: HTMLDivElement | null = this.tooltips.current

    if (tooltips) {
      let pageWidth = window.innerWidth - 25
      let pageHeight = window.innerHeight - 25
      let tooltipsWidth: number = tooltips.clientWidth
      let tooltipsHeight: number = tooltips.clientHeight
      let mouseX: number = event.pageX
      let mouseY: number = event.pageY
      let scrollY: number = window.scrollY
      let tooltipsDestinationX: number = pageWidth / 2 - tooltipsWidth / 2
      let tooltipsDestinationY: number = mouseY // scrollY + pageHeight / 2

      // -- tooltip destination x --

      while (tooltipsDestinationX > mouseX) {
        tooltipsDestinationX -= tooltipsWidth
      }
      while (tooltipsDestinationX + tooltipsWidth < mouseX) {
        tooltipsDestinationX += tooltipsWidth
      }
      if (tooltipsDestinationX < tooltipsOffsetX) {
        tooltipsDestinationX = tooltipsOffsetX
      }
      if (tooltipsDestinationX > pageWidth - tooltipsWidth - tooltipsOffsetX) {
        tooltipsDestinationX = pageWidth - tooltipsWidth - tooltipsOffsetX
      }

      // -- tooltip destination y --

      if (mouseY - scrollY > pageHeight - tooltipsHeight - tooltipsOffsetY) {
        tooltipsDestinationY -= tooltipsHeight + tooltipsOffsetY
      } else {
        tooltipsDestinationY += tooltipsOffsetY
      }

      tooltips.style.transform = `translate(${tooltipsDestinationX}px, ${tooltipsDestinationY}px)`
    }
  }

  // This will get the ID of the
  // current tooltip being displayed,
  // or null if none is being displayed.
  getCurrentTooltipID = (): string | null => {
    let tooltips: HTMLDivElement | null | undefined = this.tooltips.current
    let currentTooltipID: string | null = null

    if (tooltips !== null && tooltips.id && tooltips.id.length > 0) {
      currentTooltipID = tooltips.id
    }

    return currentTooltipID
  }

  // This will show the tooltip with
  // the given ID and description.
  showTooltip = (tooltipID: string, description: string): void => {
    let tooltips: HTMLDivElement | null | undefined = this.tooltips.current

    if (tooltips !== null) {
      tooltips.id = tooltipID
      tooltips.style.visibility = 'visible'

      this.stateSetters.setTooltipDescription(description)
    }
  }

  // This will hide the tooltip
  // currently being displayed, if
  // any.
  hideTooltip = (): void => {
    let tooltips: HTMLDivElement | null | undefined = this.tooltips.current

    if (tooltips !== null) {
      tooltips.id = ''
      tooltips.style.visibility = 'hidden'

      this.stateSetters.setTooltipDescription('')
    }
  }

  // This will create a new app
  // with the component class/function
  // passed, using a new instance of
  // global state.
  static createAppWithGlobalState(App: any): any {
    let stateSetters: IStateSetters = {
      setTooltipDescription: () => {},
    }
    let globalState: GlobalState = new GlobalState(stateSetters)

    // This adds an extra layer to the
    // rendering of the app component.
    // This is done so that the stateSetters
    // in the GlobalState object have the
    // correct functions.
    const AppWithState = (): JSX.Element | null => {
      const [_, setTooltipDescription] = useStore<string>('tooltipDescription')

      stateSetters.setTooltipDescription = setTooltipDescription

      return <App />
    }

    return withStore(AppWithState, globalState)
  }
}
