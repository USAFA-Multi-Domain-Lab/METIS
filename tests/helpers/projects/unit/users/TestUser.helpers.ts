import { User } from '@shared/users/User'
import { UserAccess } from '@shared/users/UserAccess'
import type { UserPermission } from '@shared/users/UserPermission'

/**
 * Test-only User implementation for exercising authorization logic.
 */
export class TestUser extends User {
  public constructor(options: {
    _id?: string
    accessId: Parameters<typeof UserAccess.get>[0]
    expressPermissions?: UserPermission[]
  }) {
    let access = UserAccess.get(options.accessId)
    let expressPermissions = options.expressPermissions ?? []

    super(
      options._id ?? 'test-user',
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
