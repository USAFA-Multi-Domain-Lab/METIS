import './Branding.scss'
import Tooltip from '../communication/Tooltip'

// This will brand the app with the
// logo.
const Branding = (props: {
  goHome: (() => void) | null
  tooltipDescription: string | null
}): JSX.Element | null => {
  let className: string = 'Branding'

  if (!props.goHome) {
    className += ' Disabled'
  }

  return (
    <div className={className} onClick={props.goHome ? props.goHome : () => {}}>
      <div className='Emblem'></div>
      <div className='Logo'></div>
      {props.tooltipDescription ? (
        <Tooltip description={props.tooltipDescription} />
      ) : null}
    </div>
  )
}

export default Branding
