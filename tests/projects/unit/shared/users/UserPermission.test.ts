import { describe, expect, test } from '@jest/globals'
import { User } from '@shared/users/User'
import { UserAccess } from '@shared/users/UserAccess'
import { UserPermission } from '@shared/users/UserPermission'

describe('UserPermission.hasPermissions', () => {
  test('Allows higher-level permission to satisfy more specific requirement', () => {
    let permissions = [UserPermission.AVAILABLE_PERMISSIONS.sessions_write]

    let allowed = UserPermission.hasPermissions(
      permissions,
      'sessions_write_native',
    )

    expect(allowed).toBe(true)
  })

  test('Does not allow a more specific permission to satisfy a broader requirement', () => {
    let permissions = [
      UserPermission.AVAILABLE_PERMISSIONS.sessions_join_manager_native,
    ]

    let denied = UserPermission.hasPermissions(permissions, 'sessions_join_manager')

    expect(denied).toBe(false)
  })

  test('Returns false when the required permission is missing', () => {
    let permissions = UserAccess.get('student').permissions

    let denied = UserPermission.hasPermissions(permissions, 'users_write')

    expect(denied).toBe(false)
  })

  test('Returns false for unknown permissions', () => {
    let permissions = UserAccess.get('student').permissions

    let denied = UserPermission.hasPermissions(
      permissions,
      'not_a_real_perm' as any,
    )

    expect(denied).toBe(false)
  })

  test('Returns false when any required permission is unknown', () => {
    let permissions = UserAccess.get('student').permissions

    let denied = UserPermission.hasPermissions(permissions, [
      'sessions_read',
      'totally_fake_perm',
    ] as any)

    expect(denied).toBe(false)
  })

  test('Treats an empty required list as satisfied', () => {
    let permissions = UserAccess.get('student').permissions

    let allowed = UserPermission.hasPermissions(permissions, [])

    expect(allowed).toBe(true)
  })

  test('Requires all permissions when an array is provided', () => {
    let permissions = UserAccess.get('student').permissions

    let allowed = UserPermission.hasPermissions(permissions, [
      'sessions_read',
      'environments_read',
    ])

    expect(allowed).toBe(true)

    let denied = UserPermission.hasPermissions(permissions, [
      'sessions_read',
      'users_write',
    ])

    expect(denied).toBe(false)
  })
})

describe('User.isAuthorized', () => {
  test('Denies all actions for revoked access even with express permissions', () => {
    let user = new TestUser({
      accessId: 'revokedAccess',
      expressPermissions: [UserPermission.AVAILABLE_PERMISSIONS.users_write],
    })

    expect(user.isAuthorized('users_write')).toBe(false)
  })

  test('Allows express permission to override access restrictions', () => {
    let user = new TestUser({
      accessId: 'student',
      expressPermissions: [UserPermission.AVAILABLE_PERMISSIONS.changelog_read],
    })

    expect(user.isAuthorized('changelog_read')).toBe(true)
  })

  test('Denies permission if the user does not have proper authorization', () => {
    let user = new TestUser({ accessId: 'student' })

    expect(user.isAuthorized('users_write')).toBe(false)
  })

  test('Allows permissions granted by access', () => {
    let user = new TestUser({ accessId: 'instructor' })

    expect(user.isAuthorized('missions_read')).toBe(true)
  })
})

describe('User.authorize', () => {
  test('Calls the callback and returns true when authorized', () => {
    let user = new TestUser({ accessId: 'instructor' })

    let called = false
    let authorized = user.authorize('missions_read', () => {
      called = true
    })

    expect(authorized).toBe(true)
    expect(called).toBe(true)
  })

  test('Does not call the callback and returns false when not authorized', () => {
    let user = new TestUser({ accessId: 'student' })

    let called = false
    let authorized = user.authorize('users_write', () => {
      called = true
    })

    expect(authorized).toBe(false)
    expect(called).toBe(false)
  })

  test('Denies all actions for revoked access and does not call callback even with express permissions', () => {
    let user = new TestUser({
      accessId: 'revokedAccess',
      expressPermissions: [UserPermission.AVAILABLE_PERMISSIONS.users_write],
    })

    let called = false
    let authorized = user.authorize('users_write', () => {
      called = true
    })

    expect(authorized).toBe(false)
    expect(called).toBe(false)
  })

  test('Requires all permissions when an array is provided', () => {
    let user = new TestUser({ accessId: 'instructor' })

    let called = false
    let authorized = user.authorize(['missions_read', 'sessions_read'], () => {
      called = true
    })

    expect(authorized).toBe(true)
    expect(called).toBe(true)

    called = false
    authorized = user.authorize(['missions_read', 'users_write'], () => {
      called = true
    })

    expect(authorized).toBe(false)
    expect(called).toBe(false)
  })

  test('Returns false and does not call callback for unknown permissions', () => {
    let user = new TestUser({ accessId: 'instructor' })

    let called = false
    let authorized = user.authorize('not_a_real_perm' as any, () => {
      called = true
    })

    expect(authorized).toBe(false)
    expect(called).toBe(false)
  })

  test('Treats empty required permission list as authorized and calls callback', () => {
    let user = new TestUser({ accessId: 'student' })

    let called = false
    let authorized = user.authorize([], () => {
      called = true
    })

    expect(authorized).toBe(true)
    expect(called).toBe(true)
  })
})

describe('User validation helpers', () => {
  test('Validates username format', () => {
    expect(User.isValidUsername('user_1')).toBe(true)
    expect(User.isValidUsername('ab')).toBe(false)
    expect(User.isValidUsername('has space')).toBe(false)
  })

  test('Validates password format', () => {
    expect(User.isValidPassword('ValidPassw0rd!')).toBe(true)
    expect(User.isValidPassword('short')).toBe(false)
    expect(User.isValidPassword('has space')).toBe(false)
  })
})

/**
 * Test-only User implementation for exercising authorization logic.
 */
class TestUser extends User {
  public constructor(options: {
    accessId: Parameters<typeof UserAccess.get>[0]
    expressPermissions?: UserPermission[]
  }) {
    let access = UserAccess.get(options.accessId)
    let expressPermissions = options.expressPermissions ?? []

    super(
      'test-user',
      'tester',
      access,
      'Test',
      'User',
      false,
      expressPermissions,
      User.DEFAULT_PROPERTIES.preferences,
      null,
      null,
      null,
      null,
    )
  }
}
