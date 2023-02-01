/* -- scripts -- */

import '../sass/MoreInformation.scss'
import React from 'react'
import Tooltip from './Tooltip'
// import Tooltip from './Tooltip'

/* -- interface -- */

interface Props {
  tooltipDescription: string
}

interface State {}

/* -- classes -- */

// This is a component that displays that
// renders a question mark that displays
// information in a tooltip when hovered.
export default class MoreInformation extends React.Component<Props, State> {
  static defaultProps = {}

  // inherited
  render(): JSX.Element | null {
    let tooltipDescription: string = this.props.tooltipDescription

    return (
      <div className='MoreInformation'>
        <div className='circle'>
          <div className='question-mark'>?</div>
        </div>
        <Tooltip description={tooltipDescription} />
      </div>
    )
  }
}
