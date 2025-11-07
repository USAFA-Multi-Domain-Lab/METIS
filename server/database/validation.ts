/**
 * Identifier for an error thrown due to bad data.
 */
export const ERROR_BAD_DATA: string = 'BadDataError'

/**
 * This will generate a validation error for the given message.
 * @param message The error message.
 * @returns The validation error.
 */
export function generateValidationError(message: string): Error {
  let error = new Error(message)
  error.name = ERROR_BAD_DATA
  return error
}
