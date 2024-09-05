/* -- TYPES -- */

/**
 * Available permissions for those joining a session.
 * @note Assigned to roles to determine authorization.
 * @option forceAssignable - The member can be assigned to forces
 * by a member with 'manageSessionMembers' permission.
 * @option manipulateNodes - The member can open nodes and execution
 * actions on nodes within forces to which they have access.
 * @option configureSessions - The member can update the session
 * configuration.
 * @option manageSessionMembers - The member can assign participants
 * to forces, as well as kick and ban them from the session, if needed.
 * @option startEndSessions - The member can start and end the session.
 * @option viewForeignForces - The member can view forces to which they
 * are not assigned.
 */
export type TSessionPermission =
  | 'forceAssignable'
  | 'manipulateNodes'
  | 'configureSessions'
  | 'manageSessionMembers'
  | 'startEndSessions'
  | 'viewForeignForces'
