/* -- CONTEXT -- */

import React, { useContext, useRef } from 'react'
import { TOutput_P, TOutput_S, TOutputContextData } from '.'
import { useDefaultProps } from 'src/toolbox/hooks'
import OutputInfo from './info/OutputInfo'
import './Output.scss'
import OutputMessage from './messages/OutputMessage'

/**
 * Context for the output, which will help distribute
 * output properties to its children.
 */
const OutputContext = React.createContext<TOutputContextData | null>(null)

/**
 * Hook used by Output-related components to access
 * the output context.
 */
export const useOutputContext = () => {
  const context = useContext(OutputContext) as TOutputContextData | null
  if (!context) {
    throw new Error('useOutputContext must be used within an output provider')
  }
  return context
}

/* -- COMPONENT -- */

/**
 * Renders an output with the given content for
 * an output panel.
 */
export default function Output(props: TOutput_P): JSX.Element | null {
  /* -- PROPS -- */

  const defaultedProps = useDefaultProps(props, {})

  /* -- STATE -- */

  const state: TOutput_S = {}
  const root = useRef<HTMLDivElement>(null)
  const Provider = OutputContext.Provider as React.Provider<TOutputContextData>
  const contextValue: TOutputContextData = {
    root,
    ...defaultedProps,
    state,
  }

  /* -- RENDER -- */

  return (
    <Provider value={contextValue}>
      <div className='Output' ref={root}>
        <OutputInfo />
        <OutputMessage />
      </div>
    </Provider>
  )
}
