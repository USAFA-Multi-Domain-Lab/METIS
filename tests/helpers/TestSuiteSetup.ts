import { UserModel, hashPassword } from '@metis/server/database/models/users'
import type { MetisServer } from '@metis/server/MetisServer'
import type { TUserJson } from '@shared/users/User'
import { User } from '@shared/users/User'
import { TestToolbox } from 'tests/helpers/TestToolbox'
import { TestHttpClient } from '../helpers/TestHttpClient'
import { TestMetisServer } from './TestMetisServer'

/**
 * Middleware class for test suite setup helpers.
 */
export abstract class TestSuiteSetup {
  /**
   * Creates (or returns existing) METIS server and an HTTP client bound to it.
   */
  public static async createTestContext(): Promise<TTestContext> {
    let server = await TestMetisServer.use()
    let address = server.httpServer.address()
    let port =
      typeof address === 'object' && address ? address.port : server.port
    let baseUrl = `http://127.0.0.1:${port}`
    let client = new TestHttpClient(baseUrl)
    return { server, client }
  }

  /**
   * Creates a test user with the given options. Returns both the user JSON
   * and the password for login purposes.
   * @returns The created user JSON (without password) and the plain password.
   */
  public static async createTestUser({
    username = `test_user_${TestToolbox.generateRandomId()}`,
    password = undefined,
    accessId = 'instructor',
    expressPermissionIds = [],
    firstName = 'Test',
    lastName = 'User',
  }: TCreateTestUserOptions): Promise<TCreateTestUserResult> {
    // Hash password if provided.
    let hashedPassword = password
    if (password) hashedPassword = await hashPassword(password)

    // Create user in DB.
    let newUser = await UserModel.create({
      username,
      password: hashedPassword,
      accessId,
      expressPermissionIds,
      firstName,
      lastName,
      needsPasswordReset: false,
      createdBy: User.SYSTEM_ID,
      createdByUsername: User.SYSTEM_USERNAME,
      preferences: User.DEFAULT_PROPERTIES.preferences,
    })

    let userJson: TUserJson = newUser.toJSON()
    return { user: { ...userJson, password: undefined }, username, password }
  }
}

/**
 * Options for creating a test user.
 */
export type TCreateTestUserOptions = Partial<
  Pick<
    TUserJson,
    | 'username'
    | 'password'
    | 'accessId'
    | 'expressPermissionIds'
    | 'firstName'
    | 'lastName'
  >
>

/**
 * Result from creating a test user.
 */
export type TCreateTestUserResult = {
  /**
   * Created user JSON (without password).
   */
  user: TUserJson
  /**
   * Username of the created user.
   */
  username: string
  /**
   * Password of the created user.
   */
  password?: string
}

/**
 * Shared context returned by test setup helpers.
 */
export type TTestContext = {
  /**
   * METIS server instance.
   */
  server: MetisServer
  /**
   * HTTP client bound to the METIS server.
   */
  client: TestHttpClient
}
