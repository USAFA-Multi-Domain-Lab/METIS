/**
 * A fundamental concept used in the application.
 * (e.g. a user, a mission, a session, etc.)
 */
export type TMetisComponent = {
  /**
   * Uniquely identifies the component.
   */
  _id: string
  /**
   * A human-readable title for the component.
   */
  name: string
}
