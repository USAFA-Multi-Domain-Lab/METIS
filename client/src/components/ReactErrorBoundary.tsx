// ErrorBoundary.tsx
import { LoginRequiredError } from 'metis/client/toolbox/hooks'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

/**
 * Catches errors in the component tree and renders a fallback UI.
 */
export default function ReactErrorBoundary({
  FallbackComponent,
  resetKeys,
  children,
  onError,
}: TReactErrorBoundary_P): TReactElement | null {
  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      resetKeys={resetKeys}
      onError={onError}
      children={children}
    />
  )
}

/**
 * Props for `ReactErrorBoundary` component.
 */
type TReactErrorBoundary_P = {
  /**
   * The fallback component to render when an error occurs.
   */
  FallbackComponent: React.ComponentType<FallbackProps>
  /**
   * The children to render if there are no errors.
   */
  children: React.ReactNode
  /**
   * Act as dependencies that reset the state of the app.
   */
  resetKeys?: any[]
  /**
   * Called when an error occurs.
   */
  onError?: (error: Error | LoginRequiredError, info: React.ErrorInfo) => void
}
