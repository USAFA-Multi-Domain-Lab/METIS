import React from 'react'
import { useStore } from 'react-context-hook'
import { v4 as uuid } from 'uuid'

/* -- INTERFACES -- */

interface ITooltip {
  description: string
}
interface ITooltip_S {}

/* -- CONSTANTS -- */

export const tooltipsOffsetX = 50 /*px*/
export const tooltipsOffsetY = 35 /*px*/

/* -- CLASSES -- */

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
      if (
        parentIsHoveredOver &&
        !this.isCurrentTooltipID &&
        this.props.description !== ''
      ) {
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
  const [tooltips] = useStore<React.RefObject<HTMLDivElement>>('tooltips')
  const [_, setTooltipDescription] = useStore<string>('tooltipDescription')

  let tooltip: Tooltip = props.tooltip

  // This will get the ID of the
  // current tooltip being displayed,
  // or null if none is being displayed.
  const getCurrentTooltipID = (): string | null => {
    let tooltips_elm: HTMLDivElement | null = tooltips.current
    let currentTooltipID: string | null = null

    if (
      tooltips_elm !== null &&
      tooltips_elm.id &&
      tooltips_elm.id.length > 0
    ) {
      currentTooltipID = tooltips_elm.id
    }

    return currentTooltipID
  }

  // This will show the tooltip with
  // the given ID and description.
  const showTooltip = (tooltipID: string, description: string): void => {
    let tooltips_elm: HTMLDivElement | null | undefined = tooltips.current

    if (tooltips_elm !== null) {
      tooltips_elm.id = tooltipID
      tooltips_elm.style.visibility = 'visible'

      setTooltipDescription(description)
    }
  }

  // This will hide the tooltip
  // currently being displayed, if
  // any.
  const hideTooltip = (): void => {
    let tooltips_elm: HTMLDivElement | null | undefined = tooltips.current

    if (tooltips_elm !== null) {
      tooltips_elm.id = ''
      tooltips_elm.style.visibility = 'hidden'

      setTooltipDescription('')
    }
  }

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
