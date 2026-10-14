import { describe, expect, test } from '@jest/globals'
import { SessionBasic } from '@shared/sessions/SessionBasic'
import { UserPermission } from '@shared/users/UserPermission'
import { TestUser } from 'tests/helpers/projects/unit/users/TestUser.helpers'

describe('User.canWriteToSession', () => {
  /**
   * Builds a session owned by the given user ID.
   * @param ownerId The ID of the user who owns the session.
   * @returns The session.
   */
  function createSession(ownerId: string): SessionBasic {
    let session = SessionBasic.createManualJoin('test-session')
    session.ownerId = ownerId
    return session
  }

  // Student access grants no session write permission, so each user
  // below holds only the express permission it is given.

  test('Allows an owner holding only native session write', () => {
    let user = new TestUser({
      _id: 'owner',
      accessId: 'student',
      expressPermissions: [
        UserPermission.AVAILABLE_PERMISSIONS.sessions_write_native,
      ],
    })

    expect(user.canWriteToSession(createSession('owner'))).toBe(true)
  })

  test('Denies an owner holding only foreign session write', () => {
    let user = new TestUser({
      _id: 'owner',
      accessId: 'student',
      expressPermissions: [
        UserPermission.AVAILABLE_PERMISSIONS.sessions_write_foreign,
      ],
    })

    expect(user.canWriteToSession(createSession('owner'))).toBe(false)
  })

  test('Allows a non-owner holding only foreign session write', () => {
    let user = new TestUser({
      _id: 'non-owner',
      accessId: 'student',
      expressPermissions: [
        UserPermission.AVAILABLE_PERMISSIONS.sessions_write_foreign,
      ],
    })

    expect(user.canWriteToSession(createSession('owner'))).toBe(true)
  })

  test('Denies a non-owner holding only native session write', () => {
    let user = new TestUser({
      _id: 'non-owner',
      accessId: 'student',
      expressPermissions: [
        UserPermission.AVAILABLE_PERMISSIONS.sessions_write_native,
      ],
    })

    expect(user.canWriteToSession(createSession('owner'))).toBe(false)
  })
})
