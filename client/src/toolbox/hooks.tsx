import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientUser from 'src/users'
import { TLogin } from '../../../shared/logins'

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
 * @param dependencies The dependencies to watch for changes.
 * @returns A tuple containing a boolean indicating whether the mount has been handled and a function that can be called to remount the component.
 */
export function useMountHandler(
  handler: (done: () => void) => void,
  dependencies: React.DependencyList = [],
): [boolean, () => void] {
  const [mountHandled, setMountHandled] = useState<boolean>(false)

  useEffect(() => {
    if (!mountHandled) {
      handler(() => setMountHandled(true))
    }
  }, [mountHandled, ...dependencies])

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
 * Works like `useEffect`, but the callback will not be called
 * on the initial render.
 * @param effect Imperative function that can return a cleanup function
 * @param deps If present, effect will only activate if the values in the list change.
 */
export function usePostInitEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList | undefined,
): void {
  // Tracks whether the component has been initialized.
  const initialized = useRef(false)

  // Call use effect, calling and returning result
  // of the callback only after the component has
  // been initialized.
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    } else {
      return effect()
    }
  }, deps)
}

/**
 * Requires that a user is logged in to interact with the application. If the user is not logged in, the user will be redirected to the login page.
 */
export function useRequireLogin(): [NonNullable<TLogin<ClientUser>>] {
  const globalContext = useGlobalContext()
  const [login] = globalContext.login
  // todo: implement react app error handling
  // const login = null
  const { navigateTo, handleError } = globalContext.actions

  useEffect(() => {
    if (login === null) {
      navigateTo('AuthPage', {}, { bypassMiddleware: true })
    }
  }, [login === null])

  if (login === null) {
    handleError('You must be logged in to access this page.')
    throw new LoginRequiredError()
  }

  // Return login information.
  return [login]
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

/**
 * Adds a preprocessing step before a setter is called.
 * @param state The state to add the preprocessor to. Result of `useState` call.
 * @param preprocess The preprocessing function to call before the actual setter is called.
 * @returns The processed state, including the current value and setter, as normally
 * returned by `useState`.
 */
export function withPreprocessor<T>(
  state: TReactState<T>,
  preprocess: (newValue: TReactSetterArg<T>) => TReactSetterArg<T>,
): TReactState<T> {
  const [value, setValue] = state
  return [
    value,
    (newValue: TReactSetterArg<T>) => {
      setValue(preprocess(newValue))
    },
  ]
}

/**
 * Interface for making a class compatible with the `useEventListener`
 * hook.
 */
export interface TEventListenerTarget<TEventMethod extends string> {
  /**
   * Adds an event listener to the target.
   * @param method The method of the event to listen for.
   * @param callback The callback for when the event is fired.
   * @returns The target with the event listener added.
   *
   */
  addEventListener: (
    method: TEventMethod,
    callback: () => void,
  ) => TEventListenerTarget<TEventMethod>
  /**
   * Removes an event listener from the target.
   * @param callback The callback of the listener to remove.
   * @returns The target with the event listener remove.
   */
  removeEventListener: (
    callback: () => void,
  ) => TEventListenerTarget<TEventMethod>
}

/**
 * Error that is thrown when the `useRequireLogin` hook is used
 * and the user is not logged in.
 */
export class LoginRequiredError extends Error {
  constructor() {
    super('You must be logged in to access this page.')
  }
}
