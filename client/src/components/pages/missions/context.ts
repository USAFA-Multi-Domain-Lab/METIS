import React, { useContext } from 'react'
import { TMissionPageContextData } from '.'

/**
 * Context for the mission page, which will help distribute
 * mission page properties to its children.
 */
export const MissionPageContext =
  React.createContext<TMissionPageContextData | null>(null)

/**
 * Hook used by MissionPage-related components to access
 * the mission-page context.
 */
export const useMissionPageContext = () => {
  const context = useContext(
    MissionPageContext,
  ) as TMissionPageContextData | null
  if (!context) {
    throw new Error(
      'useMissionPageContext must be used within an mission-page provider',
    )
  }
  return context
}
