import { useGlobalContext } from 'metis/client/context/global'
import If from './If'

/**
 * Only renders the provided children if the client
 * is set to debug mode.
 */
export default function ({ children }: TDevOnly_P): TReactElement | null {
  const globalContext = useGlobalContext()
  const [debugMode] = globalContext.debugMode
  return <If condition={debugMode}>{children}</If>
}

/**
 * Props for the `DevOnly` component.
 */
export type TDevOnly_P = {
  /**
   * The children to render if in a development environment.
   */
  children?: React.ReactNode
}
