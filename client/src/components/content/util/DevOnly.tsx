import If from './If'

/**
 * Only renders the provided children if the client
 * is in a development environment.
 */
export default function ({ children }: TDevOnly_P): JSX.Element | null {
  return <If condition={process.env.NODE_ENV === 'development'}>{children}</If>
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
