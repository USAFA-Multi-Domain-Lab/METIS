import axios from 'axios'
import { TListItem } from 'src/components/content/data/lists/pages/ListItem'
import User, {
  TCommonUser,
  TCommonUserJson,
  TUserJsonOptions,
  TUserOptions,
} from '../../../shared/users'
import UserAccess from '../../../shared/users/accesses'

/**
 * Class for managing users on the client.
 * @extends {User}
 */
export default class ClientUser extends User implements TListItem {
  /**
   * Used for the first password field.
   */
  public password1: TCommonUser['password']
  /**
   * Used for the second password field.
   * @note This is used to confirm the password.
   */
  public password2: TCommonUser['password']

  /**
   * Whether the password is required.
   */
  private _passwordIsRequired: boolean

  /**
   * @returns Whether the two passwords match.
   */
  public get passwordsMatch(): boolean {
    return this.password1 === this.password2
  }

  /**
   * @returns Whether the password is required.
   */
  public set passwordIsRequired(required: boolean) {
    this._passwordIsRequired = required
  }

  /**
   * Whether the password is required.
   * @note This is used to determine whether the
   * password is required when saving the user.
   * If the user is being created, then the password
   * is required. If the user is being updated, then
   * the password is not required.
   */
  public get passwordIsRequired(): boolean {
    return this._passwordIsRequired
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
      this._passwordIsRequired && !passwordEntered

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
  public constructor(
    data: Partial<TCommonUserJson> = ClientUser.DEFAULT_PROPERTIES,
    options: TClientUserOptions = {},
  ) {
    // Initialize base properties.
    super(data, options)

    let { passwordIsRequired = false } = options

    // Initialize client-specific properties.
    this._passwordIsRequired = passwordIsRequired
  }

  // Overridden abstract method
  public toJson(options: TClientUserJsonOptions = {}): TCommonUserJson {
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
   * The API endpoint for managing users.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/users'

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
        let { data: userJson } = await axios.get<TCommonUserJson>(
          `${ClientUser.API_ENDPOINT}/${_id}/`,
        )
        // Convert JSON to Client User object.
        let user: ClientUser = new ClientUser(userJson)
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
        let { data: usersJson } = await axios.get<TCommonUserJson[]>(
          ClientUser.API_ENDPOINT,
        )
        // Convert JSON to Client User objects.
        let users: ClientUser[] = usersJson.map(
          (userJson) => new ClientUser(userJson),
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
        // Retrieve data from API.
        let { data: userJson } = await axios.post<TCommonUserJson>(
          ClientUser.API_ENDPOINT,
          clientUser.toJson({ passwordIsRequired: true }),
        )
        // Convert JSON to Client User object.
        let createdUser: ClientUser = new ClientUser(userJson)
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
   * @resolves The user that was updated.
   * @rejects The error that occurred while updating the user.
   */
  public static $update(clientUser: ClientUser): Promise<ClientUser> {
    return new Promise<ClientUser>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: userJson } = await axios.put<TCommonUserJson>(
          ClientUser.API_ENDPOINT,
          clientUser.toJson({ passwordIsRequired: false, includeId: true }),
        )
        // Convert JSON to Client User object.
        let updatedUser: ClientUser = new ClientUser(userJson)
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
          _id: user._id,
          password: user.password1,
          needsPasswordReset: false,
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
  public static $delete(_id: TCommonUser['username']): Promise<void> {
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
