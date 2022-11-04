import './Branding.scss'
import Tooltip from './Tooltip'

// This will brand the app with the
// logo.
const Branding = (props: {
  goHome: () => void
  tooltipDescription: string
}): JSX.Element => {
  return (
    <div className='Branding' onClick={props.goHome}>
      MDL
      <Tooltip description={props.tooltipDescription} />
    </div>
  )
}

export default Branding
