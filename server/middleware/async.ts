/**
 * Wraps an async Express route handler to catch errors and pass them to Express error handling middleware.
 * @param handler The async route handler to wrap.
 * @returns A wrapped handler that catches promise rejections.
 * @example
 * ```typescript
 * router.post('/', asyncHandler(async (request, response) => {
 *   let result = await someAsyncOperation()
 *   response.json(result)
 * }))
 * ```
 */
export const asyncHandler = (handler: TExpressHandler): TExpressHandler => {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}
