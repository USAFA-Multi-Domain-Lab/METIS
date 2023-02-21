import Branding from './Branding'
import './Navigation.scss'
import { v4 as generateHash } from 'uuid'

export interface INavLink {
  text: string
  handleClick: () => void
  visible?: boolean
}

const Navigation = (props: {
  links: Array<INavLink>
  brandingCallback: (() => void) | null
  brandingTooltipDescription: string | null
}): JSX.Element | null => {
  let links: Array<INavLink> = props.links

  return (
    <div className='Navigation'>
      <Branding
        goHome={props.brandingCallback}
        tooltipDescription={props.brandingTooltipDescription}
      />
      {links.map((link: INavLink) => {
        if (link.visible) {
          return (
            <div
              className='Link'
              onClick={link.handleClick}
              key={generateHash()}
            >
              {link.text}
            </div>
          )
        }
      })}
    </div>
  )
}

export default Navigation
