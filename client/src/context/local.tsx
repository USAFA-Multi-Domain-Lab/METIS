import React, { useContext } from 'react'

/**
 * Class with utility methods for creating context
 * for a component tree.
 */
export class LocalContext<
  TProps extends {},
  TComputed extends {},
  TState extends {},
  TElements extends {},
> {
  /**
   * The react context used to maintain the state of the data.
   */
  public readonly reactContext = React.createContext<TLocalContextData<
    TProps,
    TComputed,
    TState,
    TElements
  > | null>(null)

  /**
   * Hook that can be used in subcomponents to access
   * the local context data.
   * @note Generic parameters are used to allow hooks
   * to be corrected in case the props, computed, state,
   * or elements types use generic parameters themselves,
   * and need correction.
   * @example
   */
  public getHook<
    TSpecificProps extends TProps = TProps,
    TSpecificComputed extends TComputed = TComputed,
    TSpecificState extends TState = TState,
    TSpecificElements extends TElements = TElements,
  >() {
    let reactContext = this.reactContext

    return function () {
      const contextData = useContext(reactContext)
      if (!contextData) {
        throw new Error('LocalContext hook must be used within its provider.')
      }
      return contextData as TLocalContextData<
        TSpecificProps,
        TSpecificComputed,
        TSpecificState,
        TSpecificElements
      >
    }
  }

  /**
   * Gets the React provider component for the local context.
   */
  public get Provider() {
    return this.reactContext.Provider
  }

  public constructor() {}
}

export function useLocalContext<
  TProps extends {},
  TComputed extends {},
  TState extends {},
  TElements extends {},
>(context: LocalContext<TProps, TComputed, TState, TElements>) {
  const contextData = useContext(context.reactContext)
  if (!contextData) {
    throw new Error('LocalContext hook must be used within its provider.')
  }
  return contextData
}

/**
 * Provides local context to a component tree.
 */
export function LocalContextProvider<
  TProps extends {},
  TComputed extends {},
  TState extends {},
  TElements extends {},
>({
  context,
  defaultedProps,
  computed,
  state,
  elements,
  children,
}: TLocalContextProvider_P<TProps, TComputed, TState, TElements>) {
  const { Provider } = context

  return (
    <Provider
      value={{
        ...defaultedProps,
        ...computed,
        state,
        elements,
      }}
    >
      {children}
    </Provider>
  )
}

/**
 * Type function that defines the data for local context.
 */
export type TLocalContextData<
  TProps extends {},
  TComputed extends {},
  TState extends {},
  TElements extends {},
> = Required<TProps> &
  TComputed & {
    state: TState
    elements: TElements
  }

/**
 * Props for the {@link LocalContextProvider} component.
 */
export interface TLocalContextProvider_P<
  TProps extends {},
  TComputed extends {},
  TState extends {},
  TElements extends {},
> {
  /**
   * The context to provide.
   */
  context: LocalContext<TProps, TComputed, TState, TElements>
  /**
   * The props for the root component after they have
   * been defaulted.
   */
  defaultedProps: Required<TProps>
  /**
   * The computed values for the root component.
   */
  computed: TComputed
  /**
   * The consolidated state for the root component.
   */
  state: TState
  /**
   * References to elements throughout the component tree.
   */
  elements: TElements
  /**
   * The the JSX to render inside the provider.
   */
  children?: React.ReactNode
}
