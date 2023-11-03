import React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { TMetisSession } from '../../../shared/sessions'
import { useGlobalContext } from '../context'
import ClientUser from 'src/users'

/**
 * Creates a handler that will be called when the component mounts.
 * @param {(done: () => void) => void} handler The handler to call when the component mounts. Done will be passed to the handler, which should be called when the handler is done processing the mount.
 * @returns {[boolean, () => void]} A tuple containing a boolean indicating whether the mount has been handled and a function that can be called to remount the component.
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
 * Requires that a session be present in the application state. If no session is present, the user will be redirected to the AuthPage.
 */
export function useRequireSession(): [TMetisSession<ClientUser>] {
  const globalContext = useGlobalContext()
  const [session] = globalContext.session
  const { goToPage } = globalContext.actions

  useEffect(() => {
    if (session === null) {
      goToPage('AuthPage', {
        returningPagePath: 'HomePage',
        returningPageProps: {},
      })
    }
  }, [session === null])

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
 * function Button(props: { text?: string; handleClick: () => void }) {
 *   useDefaultProps(props, { text: 'Click me!' })
 *
 *   let { text, handleClick } = props
 *
 *   return <div onClick={handleClick}>{text}</div>
 * }
 *
 * function Panel(props: {}) {
 *   return <div>
 *     <Button handleClick={submit} />
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
