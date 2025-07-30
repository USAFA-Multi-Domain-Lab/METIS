import axios from 'axios'
import { TMetisClientComponents } from 'src'
import { MetisComponent } from '../../../shared'
import PromiseToolbox from '../../../shared/toolbox/promises'
import User, {
  TCreatedByJson,
  TUserExistingJson,
  TUserJson,
  TUserJsonOptions,
  TUserOptions,
} from '../../../shared/users'
import UserAccess from '../../../shared/users/accesses'
import UserPermission from '../../../shared/users/permissions'

/**
 * Class for managing users on the client.
 * @extends {User}
 */
export default class ClientUser
  extends User<TMetisClientComponents>
  implements MetisComponent
{
  /**
   * Used for the first password field.
   */
  public password1: ClientUser['password']
  /**
   * Used for the second password field.
   * @note This is used to confirm the password.
   */
  public password2: ClientUser['password']

  /**
   * Marked when {@link $savePreferences} is called
   * and the preferences are already actively being
   * saved. This will cache the request until the save
   * is complete, at which point save will be recalled
   * and this will be set to false.
   */
  public pendingPreferenceSave: boolean = false

  /**
   * @returns Whether the two passwords match.
   */
  public get passwordsMatch(): boolean {
    return this.password1 === this.password2
  }

  /**
   * This makes sure the username meets
   * the correct criteria.
   */
  public get hasValidUsername(): boolean {
    return User.isValidUsername(this.username)
  }

  /**
   * This makes sure the access level meets
   * the correct criteria.
   */
  public get hasValidAccess(): boolean {
    return UserAccess.isValidAccessId(this.access._id)
  }

  /**
   * This makes sure the first name
   * meet the correct criteria.
   */
  public get hasValidFirstName(): boolean {
    return User.isValidName(this.firstName)
  }

  /**
   * This makes sure the last name
   * meet the correct criteria.
   */
  public get hasValidLastName(): boolean {
    return User.isValidName(this.lastName)
  }

  /**
   * This makes sure password 1 meets
   * the correct criteria.
   */
  public get hasValidPassword1(): boolean {
    // if the password is required, then
    // it must meet the criteria. Otherwise,
    // true is returned because the password
    // is not required. This also allows the
    // user to be able to save when editing
    // another existing user.
    return this.password1 ? User.isValidPassword(this.password1) : true
  }

  /**
   * This makes sure password 2 meets
   * the correct criteria.
   */
  public get hasValidPassword2(): boolean {
    // if the password is required, then
    // it must meet the criteria. Otherwise,
    // true is returned because the password
    // is not required. This also allows the
    // user to be able to save when editing
    // another existing user.
    return this.password2 ? User.isValidPassword(this.password2) : true
  }

  /**
   * This makes sure the user meets
   * the correct criteria needed to
   * be able to create or update the
   * user.
   */
  public get canSave(): boolean {
    // username cannot be the default value
    let updatedUsername: boolean =
      this.username !== User.DEFAULT_PROPERTIES.username
    // firstName cannot be the default value
    let updatedFirstName: boolean =
      this.firstName !== User.DEFAULT_PROPERTIES.firstName
    // lastName cannot be the default value
    let updatedLastName: boolean =
      this.lastName !== User.DEFAULT_PROPERTIES.lastName
    // access level cannot be the default value
    let updatedAccess: boolean =
      this.access._id !== User.DEFAULT_PROPERTIES.accessId
    // passwords must match
    let passwordsMatch: boolean = this.passwordsMatch
    // password must be entered if required
    let passwordEntered: boolean = this.password1 !== undefined
    // passwords cannot be empty string
    let password1IsEmptyString: boolean = this.password1 === ''
    let password2IsEmptyString: boolean = this.password2 === ''
    // there must be some kind of input for the password
    let requiredPasswordIsMissing: boolean =
      this.passwordIsRequired && !passwordEntered

    // Returns true if all conditions pass.
    return (
      updatedUsername &&
      updatedFirstName &&
      updatedLastName &&
      updatedAccess &&
      passwordsMatch &&
      !requiredPasswordIsMissing &&
      !password1IsEmptyString &&
      !password2IsEmptyString &&
      this.hasValidUsername &&
      this.hasValidAccess &&
      this.hasValidFirstName &&
      this.hasValidLastName &&
      this.hasValidPassword1 &&
      this.hasValidPassword2
    )
  }

  /**
   * @param data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param options Options for creating the user.
   */
  protected constructor(
    /**
     * Whether the password is required in order for this
     * user to be sent to the server, whether as a part
     * of a post or a put request.
     */
    public passwordIsRequired: boolean,
    // Superclass properties.
    ...args: ConstructorParameters<typeof User<TMetisClientComponents>>
  ) {
    // Initialize base properties.
    super(...args)
  }

  // Overridden abstract method
  public toJson(options: TClientUserJsonOptions = {}): TUserJson {
    // Extract the passwordIsRequired option.
    let { passwordIsRequired = false } = options

    // Grab the JSON properties from the base class.
    let json = super.toJson(options)

    // If the password is required then a new user
    // is being created and the password must be
    // set. If the password is required and the
    // passwords match, then the password is set.
    if (passwordIsRequired && this.passwordsMatch) {
      json.password = this.password1
    }
    // If the password is not required, then the
    // user is being updated and the password
    // does not need to be set. If the password
    // is required and the passwords do not match,
    // then an error is thrown.
    else if (passwordIsRequired && !this.passwordsMatch) {
      throw new Error('Passwords do not match.')
    }

    // Return the overridden JSON.
    return json
  }

  /**
   * Saves the current state of the user's preferences
   * to the server.
   * @resolves When the preferences are saved successfully.
   * @rejects The error that occurred while saving the preferences.
   */
  public $savePreferences = PromiseToolbox.createDeferredPublisher(() => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Publish changes to server.
        await axios.put<void>(`${ClientUser.API_ENDPOINT}/preferences/`, {
          preferences: this.preferences,
        })
        // Resolve
        resolve()
      } catch (error) {
        console.error('Failed to save user preferences.')
        console.error(error)
        reject(error)
      }
    })
  })

  /**
   * The API endpoint for managing users.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/users'

  /**
   * Creates a brand new user for use, ready
   * to be filled out and saved to the server.
   * @param passwordIsRequired Whether the password is required for this user.
   */
  public static createNew(options: TClientUserOptions = {}): ClientUser {
    const { passwordIsRequired = false } = options

    return new ClientUser(
      passwordIsRequired,
      User.DEFAULT_PROPERTIES._id,
      User.DEFAULT_PROPERTIES.username,
      UserAccess.get(User.DEFAULT_PROPERTIES.accessId),
      User.DEFAULT_PROPERTIES.firstName,
      User.DEFAULT_PROPERTIES.lastName,
      User.DEFAULT_PROPERTIES.needsPasswordReset,
      UserPermission.get(User.DEFAULT_PROPERTIES.expressPermissionIds),
      User.DEFAULT_PROPERTIES.preferences,
      User.DEFAULT_PROPERTIES.createdAt,
      User.DEFAULT_PROPERTIES.updatedAt,
      User.DEFAULT_PROPERTIES.createdBy,
      User.DEFAULT_PROPERTIES.createdByUsername,
    )
  }

  /**
   * @param json The JSON data of an existing user in the
   * database.
   * @returns a new {@link ClientUser} instance.
   */
  public static fromExistingJson(json: TUserExistingJson): ClientUser {
    let createdBy: ClientUser

    // Determine the value of createdBy.
    if (typeof json.createdBy === 'object') {
      createdBy = ClientUser.fromCreatedByJson(json.createdBy)
    } else if (typeof json.createdBy === 'string') {
      createdBy = ClientUser.createUnpopulated(
        json.createdBy,
        json.createdByUsername,
      )
    } else {
      throw new Error('Invalid createdBy field in user JSON.')
    }

    // Create a new user.
    return new ClientUser(
      false,
      json._id,
      json.username,
      UserAccess.get(json.accessId),
      json.firstName,
      json.lastName,
      json.needsPasswordReset,
      UserPermission.get(json.expressPermissionIds),
      json.preferences,
      new Date(json.createdAt),
      new Date(json.updatedAt),
      createdBy,
      json.createdByUsername,
    )
  }

  /**
   * Creates a new {@link ClientUser} instance used from the
   * JSON data of a `createdBy` field of a document.
   * @note createdBy will be unpopulated to prevent infinite
   * population loops.
   * @note Express permissions and preferences will be excluded
   * to maintain security and privacy.
   */
  public static fromCreatedByJson(json: TCreatedByJson): ClientUser {
    // Create a new user.
    return new ClientUser(
      false,
      json._id,
      json.username,
      UserAccess.get(json.accessId),
      json.firstName,
      json.lastName,
      json.needsPasswordReset,
      UserPermission.get(User.DEFAULT_PROPERTIES.expressPermissionIds),
      User.DEFAULT_PROPERTIES.preferences,
      new Date(json.createdAt),
      new Date(json.updatedAt),
      ClientUser.createUnpopulated(json.createdBy, json.createdByUsername),
      json.createdByUsername,
    )
  }

  /**
   * @param _id The ID of the user.
   * @param username The username of the user.
   * @returns a new user that is not populated with
   * any data, just the ID and username.
   */
  public static createUnpopulated(_id: string, username: string): ClientUser {
    // Gather details.
    const {
      accessId,
      firstName,
      lastName,
      needsPasswordReset,
      expressPermissionIds,
      preferences,
      createdAt,
      updatedAt,
      createdBy,
      createdByUsername,
    } = User.DEFAULT_PROPERTIES
    const access = UserAccess.get(accessId)
    const expressPermissions = UserPermission.get(expressPermissionIds)

    // Return and create a new ClientUser instance.
    return new ClientUser(
      false,
      _id,
      username,
      access,
      firstName,
      lastName,
      needsPasswordReset,
      expressPermissions,
      preferences,
      createdAt,
      updatedAt,
      createdBy,
      createdByUsername,
    )
  }

  /**
   * Calls the API to fetch one user by their user ID.
   * @param _id The user ID of the user to fetch.
   * @resolves The user that was fetched.
   * @rejects The error that occurred while fetching the user.
   */
  public static $fetchOne(_id: string): Promise<ClientUser> {
    return new Promise<ClientUser>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: userJson } = await axios.get<TUserExistingJson>(
          `${ClientUser.API_ENDPOINT}/${_id}/`,
        )
        // Convert JSON to Client User object.
        let user: ClientUser = ClientUser.fromExistingJson(userJson)
        // Resolve
        resolve(user)
      } catch (error) {
        console.error('Failed to fetch user.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to fetch all users available.
   * @resolves The users that were fetched.
   * @rejects The error that occurred while fetching the users.
   */
  public static $fetchAll(): Promise<ClientUser[]> {
    return new Promise<ClientUser[]>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: usersJson } = await axios.get<TUserExistingJson[]>(
          ClientUser.API_ENDPOINT,
        )
        // Convert JSON to Client User objects.
        let users: ClientUser[] = usersJson.map((userJson) =>
          ClientUser.fromExistingJson(userJson),
        )
        // Resolve
        resolve(users)
      } catch (error) {
        console.error('Failed to fetch users.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to create a new user.
   * @param clientUser The user to create.
   * @resolves The user that was created.
   * @rejects The error that occurred while creating the user.
   */
  public static $create(clientUser: ClientUser): Promise<ClientUser> {
    return new Promise<ClientUser>(async (resolve, reject) => {
      try {
        // Create record via API.
        let { data: userJson } = await axios.post<TUserExistingJson>(
          ClientUser.API_ENDPOINT,
          clientUser.toJson({ passwordIsRequired: true }),
        )
        // Convert JSON to Client User object.
        let createdUser: ClientUser = ClientUser.fromExistingJson(userJson)
        // Resolve
        resolve(createdUser)
      } catch (error) {
        console.error('Failed to create user.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to update the user.
   * @param clientUser The user to update.
   * @param options Options for the user JSON.
   * @resolves The user that was updated.
   * @rejects The error that occurred while updating the user.
   */
  public static $update(
    clientUser: ClientUser,
    options: TClientUserJsonOptions = {},
  ): Promise<ClientUser> {
    return new Promise<ClientUser>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: userJson } = await axios.put<TUserExistingJson>(
          ClientUser.API_ENDPOINT,
          clientUser.toJson({ ...options, includeId: true }),
        )
        // Convert JSON to Client User object.
        let updatedUser = ClientUser.fromExistingJson(userJson)
        // Resolve
        resolve(updatedUser)
      } catch (error) {
        console.error('Failed to update user.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to reset the password of the user that is passed in.
   * @param user The user to reset the password of.
   * @returns A promise that resolves when the password is reset.
   * @resolves When the password is reset.
   * @rejects The error that occurred while resetting the password.
   */
  public static $resetPassword(user: ClientUser): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await axios.put(`${ClientUser.API_ENDPOINT}/reset-password`, {
          password: user.password1,
        })
        resolve()
      } catch (error: any) {
        console.error('Failed to reset password.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to delete the user.
   * @param _id The user ID of the user to delete.
   * @resolves When the user is deleted.
   * @rejects The error that occurred while deleting the user.
   */
  public static $delete(_id: ClientUser['_id']): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await axios.delete(`${ClientUser.API_ENDPOINT}/${_id}/`)
        resolve()
      } catch (error: any) {
        console.error('Failed to delete user.')
        console.error(error)
        reject(error)
      }
    })
  }
}

/* ------------------------------ CLIENT USER TYPES ------------------------------ */

/**
 * Options for creating a new Client User object.
 */
export type TClientUserOptions = TUserOptions & {
  /**
   * Whether the password is required when saving.
   * @default false
   */
  passwordIsRequired?: boolean
}

/**
 * Options for creating a new Client User object.
 */
export type TClientUserJsonOptions = TUserJsonOptions & {
  /**
   * Whether the password is required when saving.
   * @default false
   */
  passwordIsRequired?: boolean
}
