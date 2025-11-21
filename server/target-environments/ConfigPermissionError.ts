/**
 * Error thrown when config file permissions are incorrect.
 * This error should crash the server on startup.
 */
export class ConfigPermissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigPermissionError'
  }
}
