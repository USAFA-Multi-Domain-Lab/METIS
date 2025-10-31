import UserApiRoute from './api-route'
import UserSchema from './schema'

/**
 * Executes all the tests for the users.
 */
export default function Users(): void {
  UserApiRoute()
  UserSchema()
}
