/**
 * Only renders the children if the condition is true.
 */
export default function ({ children, condition }: TIf_P): JSX.Element | null {
  if (!condition) return null
  return <>{children}</>
}

/**
 * Props for the `If` component.
 */
export type TIf_P = {
  /**
   * The condition to check.
   */
  condition: boolean
  /**
   * The children to render if the condition is true.
   */
  children: React.ReactNode
}
