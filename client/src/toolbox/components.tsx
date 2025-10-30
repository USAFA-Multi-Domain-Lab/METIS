import { TWithKey } from 'shared/toolbox/objects'
import ClientUser from 'src/users'
import { TLogin } from '../../../shared/logins'

/**
 * Options that can be passed to the render function.
 */
type IRendererOptions = {
  requirements: {
    mountHandled?: boolean
    login?: TLogin<ClientUser>
  }
}

/**
 * Renders a components based on the options passed. Requirements can be included in the options to restrict when the component renders, rendering it to null if failing.
 * @param {() => JSX.Element} render A function that is called to render the desired component.
 * @param options Options for the render.
 * @returns {JSX.Element | null} The rendered component.
 */
export function render(
  render: () => JSX.Element,
  options: IRendererOptions,
): JSX.Element | null {
  let { mountHandled, login } = options.requirements

  let mountHandledPasses: boolean = false
  let loginPasses: boolean = false

  // Test mount handled to see if it passes.
  if (mountHandled === undefined || mountHandled === true) {
    mountHandledPasses = true
  }
  // Test the login information to see if it passes.
  if (login === undefined || login !== null) {
    loginPasses = true
  }

  // If all pass, render.
  if (mountHandledPasses && loginPasses) {
    return render()
  }
  // Otherwise, return null.
  else {
    return null
  }
}

/**
 * Removes the `key` property from the given props.
 * @param props The props from which to remove the key.
 * @returns The props without the key property.
 */
export function removeKey<T extends TWithKey<{}>>(props: T): Omit<T, 'key'> {
  const { key, ...rest } = props
  return rest
}
