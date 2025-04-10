import React, { useCallback, useEffect, useRef } from 'react'
import { useGlobalContext } from 'src/context'
import ClientUser from 'src/users'
import { TListenerTarget } from '../../../../shared/events'
import { TLogin } from '../../../../shared/logins'
import {
  TDefaultProps,
  TRequireLoginReturn,
  TResizeObserverOptions,
} from './index.d'

/* -- HOOKS -- */

/**
 * Requires that a user is logged in to interact with the application.
 * If the user is not logged in, the user will be redirected to the
 * login page.
 * @returns The login information for the user.
 */
export function useRequireLogin(): TRequireLoginReturn {
  // Get login information from global context.
  const globalContext = useGlobalContext()
  const [login] = globalContext.login

  // Throw error if user is not logged in.
  if (login === null) throw new LoginRequiredError()

  // Return login information.
  return {
    login: login as NonNullable<TLogin<ClientUser>>,
    user: login.user,
    isAuthorized: login.user.isAuthorized,
    authorize: login.user.authorize,
  }
}

/**
 * Creates a funciton component that will render a given component for each set of props passed in a list.
 * @param Component A function component to render.
 * @param propsList A list of prop objects, each of which will be passed to the component to render.
 * @param keyFrom There are two options for this parameter: One, you can choose a property of the props to use as a key by passing the property name for that prop. Two, you can pass a function that can be used to generate a key for each component rendered. This function will provide the props for each component as an argument.
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
export function useEventListener<
  TEventMethod extends string,
  TCallbackArgs extends Array<any>,
>(
  target: TListenerTarget<TEventMethod, TCallbackArgs> | null,
  methods: TEventMethod | TEventMethod[],
  callback: (...args: TCallbackArgs) => any,
  dependencies: React.DependencyList = [],
): void {
  /**
   * Cached callback function.
   */
  const listener = useCallback(
    (...args: TCallbackArgs) => {
      callback(...args)
    },
    [target, ...dependencies],
  )

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
      // Convert methods to an array, if
      // not already..
      methods = Array.isArray(methods) ? methods : [methods]

      // Remove listener from the target.
      for (let method of methods) target?.removeEventListener(method, listener)
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

/**
 * Hooks that allows a component to use a resize observer
 * on an element stored in a ref.
 * @param ref The ref to the element to observe.
 * @param callback The callback to call when the element resizes.
 * @param dependencies The dependencies to watch for changes. These
 * will be passed to a `useCallback` hook to update the callback
 * when the dependencies change. This will not recreate the observer.
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement>,
  callback: (clientWidth: number, clientHeight: number) => void,
  dependencies: React.DependencyList = [],
  options: TResizeObserverOptions = {},
): void {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [ref.current, ...dependencies])

  useEffect(() => {
    if (ref.current) {
      const observer = new ResizeObserver(() => {
        // Avoid calling the callback, if the
        // ref is not set.
        if (!ref.current) return

        // Call the callback with the new
        // dimensions.
        callbackRef.current(ref.current!.clientWidth, ref.current!.clientHeight)
      })
      observer.observe(ref.current)

      return () => {
        observer.disconnect()
      }
    }
  }, [ref.current])
}
/**
 * Takes in a components props and an object defining default props. If any property of default props is undefined for the corresponding value in props, the default value will be assigned in props.
 * @param props The props to assign default values to.
 * @param defaultProps The default values to assign to props.
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
  TDefault extends TDefaultProps<TProps>,
  TReturned extends Required<TProps> = Required<TProps>,
>(props: TProps, defaultProps: TDefault): TReturned {
  let returnedProps: any = {
    ...defaultProps,
    ...props,
  }
  return returnedProps
}

/* -- CLASSES -- */

/**
 * Error that is thrown when the `useRequireLogin` hook is used
 * and the user is not logged in.
 */
export class LoginRequiredError extends Error {
  constructor() {
    super('You must be logged in to access this page.')
  }
}

/* -- EXPORTS -- */

export * from './index.d'
export * from './lifecycles'
export * from './states'
