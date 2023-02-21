import Branding from './Branding'
import './Navigation.scss'
import { v4 as generateHash } from 'uuid'

export interface INavigation {
  links: Array<INavLink>
  brandingCallback: (() => void) | null
  brandingTooltipDescription: string | null
}

export interface INavLink {
  text: string
  key: string
  handleClick: () => void
  visible?: boolean
}

const Navigation = (props: INavigation): JSX.Element | null => {
  let links: Array<INavLink> = props.links

  return (
    <div className='Navigation'>
      <Branding
        goHome={props.brandingCallback}
        tooltipDescription={props.brandingTooltipDescription}
      />
      {links.map((link: INavLink) => {
        let text: string = link.text
        let key: string = link.key
        let visible: boolean = link.visible ?? true
        let className: string = 'Link'

        if (!visible) {
          className += ' Hidden'
        }

        return (
          <div className={className} onClick={link.handleClick} key={key}>
            {text}
          </div>
        )
      })}
    </div>
  )
}

export default Navigation
