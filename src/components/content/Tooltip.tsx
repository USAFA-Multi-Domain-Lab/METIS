/* -- imports -- */

import React from 'react'
import { useStore } from 'react-context-hook'
import { v4 as uuid } from 'uuid'

/* -- interface -- */

interface ITooltip {
  description: string
}
interface ITooltip_S {}

/* -- classes -- */

// This is a tooltip component that
// can be rendered in the child of
// an element so that when that element
// is hovered over, a tooltip is displayed
// with a given description.
export default class Tooltip extends React.Component<ITooltip, ITooltip_S> {
  tooltipID: string = uuid()
  rootElement: React.RefObject<HTMLDivElement> = React.createRef()

  // This returns the tooltip ID
  // for the tooltip that is currently
  // being displayed by the application
  // to the user.
  getCurrentTooltipID: () => string | null = () => null

  // This returns whether this tooltip
  // is the tooltip that is currently
  // being displayed to the user.
  get isCurrentTooltipID(): boolean {
    return this.getCurrentTooltipID() === this.tooltipID
  }

  // This will set the tooltip with the ID
  // passed as the curerrent tooltip to
  // display to the user, with the description
  // passed.
  showTooltip: (tooltipID: string, description: string) => void = () => {}

  // This will clear the current tooltip
  // being displayed, hiding it from view.
  hideTooltip: () => void = () => {}

  // This is called when the target element
  // that triggers this tooltip is no longer
  // hovered over.
  handleMouseLeave = () => {
    this.hideTooltip()
  }

  // inherited
  componentDidMount(): void {
    let tooltip: HTMLDivElement | null = this.rootElement.current
    let parent: HTMLElement | null | undefined = tooltip?.parentElement

    if (tooltip && parent) {
      parent.addEventListener('mouseleave', this.handleMouseLeave)
      parent.addEventListener('mousemove', this.confirmTooltipVisibility)
    }
  }

  // inherited
  componentWillUnmount(): void {
    let tooltip: HTMLDivElement | null = this.rootElement.current
    let parent: HTMLElement | null | undefined = tooltip?.parentElement

    if (tooltip && parent) {
      parent.removeEventListener('mouseleave', this.handleMouseLeave)
      parent.removeEventListener('mousemove', this.confirmTooltipVisibility)
      if (this.isCurrentTooltipID) {
        this.hideTooltip()
      }
    }
  }

  // inherited
  componentDidUpdate(previousProps: ITooltip, previousState: ITooltip_S): void {
    if (this.props.description !== previousProps.description) {
      this.showTooltip(this.tooltipID, this.props.description)
    }
    this.confirmTooltipVisibility()
  }

  // This is the tooltip render logic.
  // This will, based on the mouse position,
  // determine whether to display a tooltip,
  // which tooltip to display, and when to
  // not display a tooltip at all.
  confirmTooltipVisibility = (): void => {
    let tooltip: HTMLDivElement | null = this.rootElement.current
    let parent: HTMLElement | null | undefined = tooltip?.parentElement

    if (tooltip && parent) {
      let parentIsHoveredOver: boolean = parent.matches(':hover')
      if (parentIsHoveredOver && !this.isCurrentTooltipID) {
        this.showTooltip(this.tooltipID, this.props.description)
      } else if (!parentIsHoveredOver && this.isCurrentTooltipID) {
        this.hideTooltip()
      }
    }
  }

  // inherited
  render() {
    return (
      <div className='Tooltip' ref={this.rootElement}>
        <TooltipLogic tooltip={this} />
      </div>
    )
  }
}

function TooltipLogic(props: { tooltip: Tooltip }): JSX.Element | null {
  const [getCurrentTooltipID] = useStore<() => string | null>(
    'getCurrentTooltipID',
  )
  const [showTooltip] =
    useStore<(tooltipID: string, description: string) => void>('showTooltip')
  const [hideTooltip] = useStore<() => void>('hideTooltip')

  let tooltip: Tooltip = props.tooltip
<<<<<<< HEAD
=======

>>>>>>> jacob.thomas
  return (
    <div className='TooltipLogic'>
      {((): null => {
        tooltip.getCurrentTooltipID = getCurrentTooltipID
        tooltip.showTooltip = showTooltip
        tooltip.hideTooltip = hideTooltip

        return null
      })()}
    </div>
  )
}
