import { TMetisSession } from './users'

/**
 * Options that can be passed to the render function.
 */
type IRendererOptions = {
  requirements: {
    mountHandled?: boolean
    session?: TMetisSession
  }
}

/**
 * Renders a components based on the options passed. Requirements can be included in the options to restrict when the component renders, rendering it to null if failing.
 * @param {() => JSX.Element} render A function that is called to render the desired component.
 * @param {IRendererOptions} options Options for the render.
 * @returns {JSX.Element | null} The rendered component.
 */
export function render(
  render: () => JSX.Element,
  options: IRendererOptions,
): JSX.Element | null {
  let { mountHandled, session } = options.requirements

  let mountHandledPasses: boolean = false
  let sessionPasses: boolean = false

  // Test mount handled to see if it passes.
  if (mountHandled === undefined || mountHandled === true) {
    mountHandledPasses = true
  }
  // Test session to see if it passes.
  if (session === undefined || session !== null) {
    sessionPasses = true
  }

  // If all pass, render.
  if (mountHandledPasses && sessionPasses) {
    return render()
  }
  // Otherwise, return null.
  else {
    return null
  }
}
