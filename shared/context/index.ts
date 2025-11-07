/**
 * Will equal 'react' or 'express' based on the context of the application.
 */
export const context: 'express' | 'react' =
  typeof window === 'undefined' ? 'express' : 'react'
