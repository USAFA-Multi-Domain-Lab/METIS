import './Branding.scss'
import Tooltip from './Tooltip'

// This will brand the app with the
// logo.
const Branding = (props: {
  goHome: () => void
  tooltipDescription: string
  showTooltip: boolean
}): JSX.Element | null => {
  if (props.showTooltip) {
    return (
      <div className='Branding' onClick={props.goHome}>
        <Tooltip description={props.tooltipDescription} display={true} />
      </div>
    )
  } else {
    return <div className='Branding disabled'></div>
  }
}

export default Branding
