/**
 * The result of comparing two semantic versions.
 * @option 'later' - versionA is later than versionB
 * @option 'earlier' - versionA is earlier than versionB
 * @option 'equal' - versionA is equal to versionB
 */
export type TVersionComparisonResult = 'later' | 'earlier' | 'equal'
