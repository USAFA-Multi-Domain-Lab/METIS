import React, { useCallback, useEffect, useRef, useState } from 'react'
import ClientUser from 'src/users'
import { TMetisSession } from '../../../shared/sessions'
import { useGlobalContext } from '../context'

/**
 * The callback for the useEffect hook.
 */
type EffectsCallback = Parameters<typeof useEffect>[0]
/**
 * The return type for the useEffect hook callback.
 */
type EffectsCallbackReturned = ReturnType<EffectsCallback>

/**
 * Creates a handler that will be called when the component mounts.
 * @param handler The handler to call when the component mounts. Done will be passed to the handler, which should be called when the handler is done processing the mount.
 * @returns A tuple containing a boolean indicating whether the mount has been handled and a function that can be called to remount the component.
 */
export function useMountHandler(
  handler: (done: () => void) => void,
): [boolean, () => void] {
  const [mountHandled, setMountHandled] = useState<boolean>(false)

  useEffect(() => {
    if (!mountHandled) {
      handler(() => setMountHandled(true))
    }
  }, [mountHandled])

  const remount = useCallback(() => {
    setMountHandled(false)
  }, [])

  return [mountHandled, remount]
}

/**
 * Creates a handler that will be called when the component unmounts.
 * @param handler The handler that is called upon unmount.
 * @returns Whether the component will unmount, changes after handler is called.
 */
export function useUnmountHandler(handler: () => void): boolean {
  const unmounted = useRef<boolean>(false)

  useEffect(() => {
    return () => {
      handler()
      unmounted.current = true
    }
  }, [])

  return unmounted.current
}

/**
 * Requires that a session be present in the application state. If no session is present, the user will be redirected to the AuthPage.
 */
export function useRequireSession(): [NonNullable<TMetisSession<ClientUser>>] {
  const globalContext = useGlobalContext()
  const [session] = globalContext.session
  // todo: remove (require session)
  // const session = null
  const { navigateTo } = globalContext.actions

  useEffect(() => {
    if (session === null) {
      navigateTo('AuthPage', {})
    }
  }, [session === null])

  if (session === null) {
    throw new SessionRequiredError()
  }

  // Return session.
  return [session]
}

/**
 * Takes in a components props and an object defining default props. If any property of default props is undefined for the corresponding value in props, the default value will be assigned in props.
 * @param {TProps} props The props to assign default values to.
 * @param {TProps} defaultProps The default values to assign to props.
 * @example
 * ```
 * // This component will have a default
 * // text of 'Click me!' if no text is
 * // provided.
 * function Button(props: { text?: string; onClick: () => void }) {
 *   useDefaultProps(props, { text: 'Click me!' })
 *
 *   let { text, onClick } = props
 *
 *   return <div onClick={onClick}>{text}</div>
 * }
 *
 * function Panel(props: {}) {
 *   return <div>
 *     <Button onClick={submit} />
 *   </div>
 * }
 * ```
 */
export function useDefaultProps<
  TProps extends {},
  TDefaultProps extends Partial<TProps>,
  TReturnedProps extends Omit<TProps, keyof TDefaultProps> & TDefaultProps,
>(props: TProps, defaultProps: TDefaultProps): TReturnedProps {
  let returnedProps: any = {
    ...defaultProps,
    ...props,
  }
  return returnedProps
}

/**
 * Creates a funciton component that will render a given component for each set of props passed in a list.
 * @param {React.FunctionComponent<TProps>} Component A function component to render.
 * @param {Array<TProps>} propsList A list of prop objects, each of which will be passed to the component to render.
 * @param {TPropKeys | ((props: TProps) => string)} keyFrom There are two options for this parameter: One, you can choose a property of the props to use as a key by passing the property name for that prop. Two, you can pass a function that can be used to generate a key for each component rendered. This function will provide the props for each component as an argument.
 * @returns
 */
export function useListComponent<
  TProps extends {},
  TPropKeys extends keyof TProps,
>(
  Component: React.FunctionComponent<TProps>,
  propsList: Array<TProps>,
  keyFrom: TPropKeys | ((props: TProps) => string),
): () => JSX.Element | null {
  return useCallback(
    () => (
      <>
        {propsList.map((props) => (
          <Component
            {...props}
            key={
              typeof keyFrom === 'function'
                ? keyFrom(props)
                : (props[keyFrom] as string)
            }
          />
        ))}
      </>
    ),
    [Component, propsList, keyFrom],
  )
}

/**
 * Automatically adds and removes an event listener to the given
 * target.
 *
 * The event listener will be automatically added to a
 * new target if the target changes, and the event listener will
 * be automatically removed from the old target also. The listener
 * will be automatically removed from the target when the component
 * unmounts.
 * @param target The target to add the event listener to.
 * @param methods The event type to listen for.
 * @param callback The callback to call when the event is fired.
 * @param dependencies The dependencies to use for the callback.
 */
export function useEventListener<TEventMethod extends string>(
  target: TEventListenerTarget<TEventMethod> | null,
  methods: TEventMethod | TEventMethod[],
  callback: () => void,
  dependencies: React.DependencyList = [],
): void {
  /**
   * Cached callback function.
   */
  const listener = useCallback(() => {
    callback()
  }, [target, ...dependencies])

  /* -- effect -- */

  // Register the event listener, reregistering
  // if the callback ever changes.
  useEffect(() => {
    // Convert methods to an array, if
    // not already..
    methods = Array.isArray(methods) ? methods : [methods]

    // Add listener to the new target.
    for (let method of methods) target?.addEventListener(method, listener)

    // Return clean up function for
    // removing the listener when done.
    return () => {
      target?.removeEventListener(listener)
    }
  }, [listener])
}

/**
 * Creates CSS inline styling that can be used in a JSX element.
 * @param construct A function that will be called with the styling object as an argument.
 * The function should modify the styling object to add styling properties.
 * @param initialStyle The initial styling before any styling is added by the construct function.
 * @returns The resulting inline styling.
 */
export function useInlineStyling(
  construct: (style: React.CSSProperties) => void,
  initialStyle: React.CSSProperties = {},
): React.CSSProperties {
  let style: React.CSSProperties = { ...initialStyle }
  construct(style)
  return style
}

export type TEventListenerTarget<TEventMethod extends string> = {
  addEventListener: (eventName: TEventMethod, handler: () => void) => any
  removeEventListener: (handler: () => void) => any
}

/**
 * Error that is thrown when the `useRequireSession` hook is used
 * and no session is present.
 */
export class SessionRequiredError extends Error {
  constructor() {
    super('Session is required.')
  }
}
