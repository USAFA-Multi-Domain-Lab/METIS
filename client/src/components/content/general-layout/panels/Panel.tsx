import React, { Children, isValidElement, useContext, useState } from 'react'
import { compute } from 'src/toolbox'
import ClassList from '../../../../../../shared/toolbox/html/class-lists'
import './Panel.scss'
import PanelView, { TPanelView_P } from './PanelView'
import PanelTabBar from './tabs/PanelTabBar'

/**
 * The context for panels in the layout.
 */
const PanelContext = React.createContext<TPanelContextData | null>(null)

/**
 * Hook used by `Panel` components to access
 * the context specific to the panel.
 */
export const usePanelContext = () => {
  const context = useContext(PanelContext) as TPanelContextData | null
  if (!context) {
    throw new Error('usePanelContext must be used within an panel provider')
  }
  return context
}

/**
 * A general container component in METIS, with the potential
 * for resizing and tabbed views.
 */
export default function ({ children }: TPanel_P): TReactElement | null {
  /* -- STATE -- */

  const Provider = PanelContext.Provider as React.Provider<TPanelContextData>
  const state: TPanel_S = {
    selectedView: useState<TPanelView_P | null>(null),
  }

  /* -- VALIDATION -- */

  let childArray = Children.toArray(children)
  let viewElements: React.ReactElement<TPanelView_P>[] = []

  // Verify that children are `PanelView` component
  // instances.
  for (let element of childArray) {
    if (!isValidElement(element)) {
      throw new Error('Panel children must be instances of PanelView.')
    }
    if (element.type !== PanelView) {
      throw new Error('Panel children must be instances of PanelView.')
    }
    viewElements.push(element as React.ReactElement<TPanelView_P>)
  }

  // Confirm that all titles are unique.
  let titleArray = viewElements.map((view) => view.props.title)
  let titleSet = new Set(titleArray)
  if (titleSet.size !== titleArray.length) {
    throw new Error('PanelView titles must be unique.')
  }

  /* -- COMPUTED -- */

  /**
   * The class names of the root element of the
   * component.
   */
  const rootClasses = compute<ClassList>(() => {
    let result = new ClassList('Panel')
    result.set('Tabbed', viewElements.length > 1)
    return result
  })

  /**
   * The props for the views passed to the panel.
   */
  const views = viewElements.map((view) => view.props)

  /**
   * The value to pass in the context provider.
   */
  const contextValue = compute<TPanelContextData>(() => {
    return {
      state,
      views,
    }
  })

  /* -- RENDER -- */

  return (
    <Provider value={contextValue}>
      <div className={rootClasses.value}>
        <PanelTabBar />
        {children}
      </div>
    </Provider>
  )
}

/**
 * Prop type for `Panel`.
 */
export interface TPanel_P {
  /**
   * The content of the panel.
   */
  children?: React.ReactNode
}

/**
 * Comprehensive state type for the `Panel` component.
 */
export type TPanel_S = {
  /**
   * The currently selected view in the panel.
   */
  selectedView: TReactState<TPanelView_P | null>
}

/**
 * The context data provided to panels in the
 * layout.
 */
export type TPanelContextData = {
  /**
   * The current state for the panel.
   */
  state: TPanel_S
  /**
   * All views in the panel.
   */
  views: TPanelView_P[]
}
