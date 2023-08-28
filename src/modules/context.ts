/**
 * Will equal 'react' or 'express' based on the context of the application.
 */
const context = typeof window === 'undefined' ? 'express' : 'react'

export default context
