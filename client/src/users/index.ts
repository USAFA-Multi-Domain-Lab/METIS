import axios, { AxiosError, AxiosResponse } from 'axios'
import { TMetisSession, TMetisSessionJson } from '../../../shared/sessions'
import User, {
  TCommonUser,
  TCommonUserJson,
  TUserOptions,
} from '../../../shared/users'
import UserRole from '../../../shared/users/roles'

/**
 * Class for managing users on the client.
 * @extends {User}
 */
export default class ClientUser extends User {
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
   * This makes sure the role meets
   * the correct criteria.
   */
  public get hasValidRole(): boolean {
    return UserRole.isValidRoleId(this.role._id)
  }

  /**
   * This makes sure the first name
   * meet the correct criteria.
   */
  public get hasValidFirstName(): boolean {
    let nameRegex: RegExp = new RegExp(/^([a-zA-Z']{1,25})$/)
    return nameRegex.test(this.firstName)
  }

  /**
   * This makes sure the last name
   * meet the correct criteria.
   */
  public get hasValidLastName(): boolean {
    let nameRegex: RegExp = new RegExp(/^([a-zA-Z']{1,25})$/)
    return nameRegex.test(this.lastName)
  }

  /**
   * This makes sure password 1 meets
   * the correct criteria.
   */
  public get hasValidPassword1(): boolean {
    let passwordRegex: RegExp = new RegExp(/^([^\s]{8,50})$/)

    // if the password is required, then
    // it must meet the criteria. Otherwise,
    // true is returned because the password
    // is not required. This also allows the
    // user to be able to save when editing
    // another existing user.
    return this.password1 ? passwordRegex.test(this.password1) : true
  }

  /**
   * This makes sure password 2 meets
   * the correct criteria.
   */
  public get hasValidPassword2(): boolean {
    let passwordRegex: RegExp = new RegExp(/^([^\s]{8,50})$/)

    // if the password is required, then
    // it must meet the criteria. Otherwise,
    // true is returned because the password
    // is not required. This also allows the
    // user to be able to save when editing
    // another existing user.
    return this.password2 ? passwordRegex.test(this.password2) : true
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
    // role cannot be the default value
    let updatedRole: boolean = this.role._id !== User.DEFAULT_PROPERTIES.roleId
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
      updatedRole &&
      passwordsMatch &&
      !requiredPasswordIsMissing &&
      !password1IsEmptyString &&
      !password2IsEmptyString &&
      this.hasValidUsername &&
      this.hasValidRole &&
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
    data: Partial<TCommonUserJson> = User.DEFAULT_PROPERTIES,
    options: TClientUserOptions = {},
  ) {
    // Initialize base properties.
    super(data, options)

    // Initialize client-specific properties.
    this._passwordIsRequired = options.passwordIsRequired ?? false
  }

  // Overridden abstract method
  public toJson(options: TClientUserOptions = {}): TCommonUserJson {
    // Extract the passwordIsRequired option.
    let { passwordIsRequired } = options

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
   * Fetches the current session of the logged in user from the server.
   * @resolves The session of the logged in user.
   * @rejects The error that occurred while fetching the session.
   */
  public static $fetchSession(): Promise<TMetisSession<ClientUser>> {
    return new Promise<TMetisSession<ClientUser>>(
      async (
        resolve: (session: TMetisSession<ClientUser>) => void,
        reject: (error: AxiosError) => void,
      ) => {
        try {
          let { data: sessionJson } = await axios.get<TMetisSessionJson>(
            `${ClientUser.API_ENDPOINT}/session`,
          )
          let session: TMetisSession<ClientUser> = null

          // If the session JSON is not null,
          // parse the data.
          if (sessionJson !== null) {
            session = {
              user: new ClientUser(sessionJson.user),
              gameId: sessionJson.gameId,
            }
          }

          // Resolve the promise with the
          // session returned.
          resolve(session)
        } catch (error: any) {
          // If request fails, reject the promise
          // with the error given in the catch.
          console.error('Failed to retrieve session.')
          console.error(error)
          reject(error)
        }
      },
    )
  }

  /**
   * Attempts to log in the user with the given username and password.
   * @param username The username to login with.
   * @param password The user's password to login with.
   * @resolves The object containing whether the login was correct and the session of the logged in user.
   * @rejects The error that occurred while logging in.
   */
  public static $login(
    username: TCommonUser['username'],
    password: string,
  ): Promise<{
    session: TMetisSession<ClientUser>
  }> {
    return new Promise<{
      session: TMetisSession<ClientUser>
    }>(async (resolve, reject) => {
      try {
        let response: AxiosResponse = await axios.post<TMetisSessionJson>(
          `${ClientUser.API_ENDPOINT}/login`,
          { username, password },
        )

        // Parse the response data.
        let sessionJson: TMetisSessionJson = response.data.session
        let session: TMetisSession<ClientUser> = null

        // If the session JSON is not null,
        // parse the date.
        if (sessionJson !== null) {
          session = {
            user: new ClientUser(sessionJson.user),
            gameId: sessionJson.gameId,
          }
        }

        resolve({ session })
      } catch (error: any) {
        console.error('Failed to login user.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Logs out the user in the session.
   * @resolves When the user is logged out.
   * @rejects The error that occurred while logging out.
   */
  public static $logout(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await axios.post(`${ClientUser.API_ENDPOINT}/logout`)
        await ClientUser.$fetchSession()
        resolve()
      } catch (error: any) {
        console.error('Failed to logout user.')
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
          { user: clientUser.toJson({ passwordIsRequired: true }) },
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
          { user: clientUser.toJson({ passwordIsRequired: false }) },
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
   * Whether the password is required when saving. Defaults to false.
   */
  passwordIsRequired?: boolean
}
