/**
 * Validates a UUID string using a regex.
 * @param uuid The UUID to validate.
 * @note This will validate version 1-5 UUIDs.
 * @note **This is a simple UUID validator. It doesn't check to see if the UUID is in use.**
 */
export const uuidTypeValidator = (uuid: string): boolean => {
  const uuidTypeRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/
  return uuidTypeRegex.test(uuid)
}

export default { uuidTypeValidator }
