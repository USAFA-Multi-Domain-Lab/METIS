import { useGlobalContext } from 'src/context'
import { TUserPermissionId } from '../../../../../shared/users/permissions'
import If from './If'

/**
 * Only renders the provided children if the current
 * user in the global context is authenticated.
 * @note Only works if within a `GlobalContextProvider`.
 */
export default function Auth({
  permissions,
  children,
}: TAuth_P): JSX.Element | null {
  const globalContext = useGlobalContext()
  const [login] = globalContext.login
  return <If condition={login?.user.isAuthorized(permissions)}>{children}</If>
}

/**
 * Props for the `Auth` component.
 */
export type TAuth_P = {
  /**
   * The permissions the user must have to see the children.
   */
  permissions: TUserPermissionId[]
  /**
   * The children to render if the user is authenticated.
   */
  children?: React.ReactNode
}
