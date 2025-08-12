/**
 * Makes _id required for an interface with
 * recursive application to any nested objects.
 */
type RequireIdDeep<T> = {
  [K in keyof T]-?: K extends '_id'
    ? NonNullable<T[K]> // force `_id` to be required and non-nullable
    : T[K] extends (infer U)[]
    ? RequireIdDeep<U>[]
    : T[K] extends object
    ? RequireIdDeep<T[K]>
    : T[K]
}

/**
 * Defines preferences for a user, customizing their
 * experience while using the application.
 */
export default interface TUserPreferencesJson {
  /**
   * Uniquely identifies the object.
   */
  _id?: string
  /**
   * Customizes the mission-map experience for
   * the user.
   */
  missionMap: {
    /**
     * Uniquely identifies the object.
     */
    _id?: string
    /**
     * Whether to pan to the relevant node when a defect is
     * selected in the mission.
     */
    panOnDefectSelection: boolean
  }
}

/**
 * Represents preferences for an existing user,
 * with IDs already assigned.
 */
export type TExistingUserPreferencesJson = RequireIdDeep<TUserPreferencesJson>
