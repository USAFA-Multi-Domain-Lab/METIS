import axios, { AxiosError, AxiosResponse } from 'axios'
import User, { IUser, IUserJSON, IUserOptions } from '../../../shared/users'
import { TMetisSessionJSON } from '../../../shared/sessions'
import { TMetisSession } from '../../../shared/sessions'
import UserRole, { IUserRoleJSON } from '../../../shared/users/roles'
import UserPermission, {
  IUserPermissionJSON,
} from '../../../shared/users/permissions'

/**
 * Options for creating new Client User objects.
 */
export type TClientUserOptions = IUserOptions & {
  /**
   * Whether the password is required when saving. Defaults to false.
   */
  passwordIsRequired?: boolean
}

/**
 * Class for managing users on the client.
 * @extends {User}
 */
export default class ClientUser extends User {
  public password1: IUser['password']
  public password2: IUser['password']

  private _passwordIsRequired: boolean

  /**
   * @returns {boolean} Whether the two passwords match.
   */
  public get passwordsMatch(): boolean {
    return this.password1 === this.password2
  }

  /**
   * @returns {boolean} Whether the password is required.
   */
  public set passwordIsRequired(required: boolean) {
    this._passwordIsRequired = required
  }

  /**
   * @returns {boolean} Whether the password is required.
   * @description This is used to determine whether the
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
    let userIDRegex: RegExp = new RegExp(/^([a-zA-Z0-9-_.]{5,25})$/)
    return userIDRegex.test(this.userID)
  }

  /**
   * This makes sure the role meets
   * the correct criteria.
   */
  public get hasValidRole(): boolean {
    return UserRole.isValidRoleID(this.role.id)
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
    // userID cannot be the default value
    let updatedUserID: boolean = this.userID !== User.DEFAULT_PROPERTIES.userID
    // firstName cannot be the default value
    let updatedFirstName: boolean =
      this.firstName !== User.DEFAULT_PROPERTIES.firstName
    // lastName cannot be the default value
    let updatedLastName: boolean =
      this.lastName !== User.DEFAULT_PROPERTIES.lastName
    // role cannot be the default value
    let updatedRole: boolean = this.role !== User.DEFAULT_PROPERTIES.role
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
      updatedUserID &&
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
   * @param {IUserJSON} data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param {TClientUserOptions} options Options for creating the user.
   */
  public constructor(
    data: Partial<IUserJSON> = User.DEFAULT_PROPERTIES,
    options: TClientUserOptions = {},
  ) {
    // Initialize base properties.
    super(data, options)

    // Initialize client-specific properties.
    this._passwordIsRequired = options.passwordIsRequired ?? false
  }

  // Implemented abstract method
  protected parseUserRoleData(data: IUserRoleJSON): UserRole {
    return new UserRole(
      data.id,
      UserRole.AVAILABLE_ROLES[data.id].name,
      UserRole.AVAILABLE_ROLES[data.id].description,
      UserRole.AVAILABLE_ROLES[data.id].permissions,
    )
  }

  // Implemented abstract method
  protected parseUserPermissionData(
    data: IUserPermissionJSON[],
  ): UserPermission[] {
    return data.map(
      (datum) =>
        new UserPermission(
          datum.id,
          UserPermission.AVAILABLE_PERMISSIONS[datum.id].name,
          UserPermission.AVAILABLE_PERMISSIONS[datum.id].description,
        ),
    )
  }

  /**
   * The API endpoint for managing users.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/users'

  /**
   * Calls the API to fetch one user by their user ID.
   * @param {string} userID The user ID of the user to fetch.
   * @returns {Promise<ClientUser>} A promise that resolves to a Client User object.
   */
  public static async fetchOne(userID: string): Promise<ClientUser> {
    return new Promise<ClientUser>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: userJSON } = await axios.get<IUserJSON>(
          `${ClientUser.API_ENDPOINT}`,
          { params: { userID } },
        )
        // Convert JSON to Client User object.
        let user: ClientUser = new ClientUser(userJSON)
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
   * @returns {Promise<ClientUser[]>} A promise that resolves to an array of Client User objects.
   */
  public static async fetchAll(): Promise<ClientUser[]> {
    return new Promise<ClientUser[]>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: usersJSON } = await axios.get<IUserJSON[]>(
          ClientUser.API_ENDPOINT,
        )
        // Convert JSON to Client User objects.
        let users: ClientUser[] = usersJSON.map(
          (userJSON) => new ClientUser(userJSON),
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
   * @returns {Promise<TMetisSession<ClientUser>>} A promise that resolves to the current session of the logged in user.
   */
  public static async fetchSession(): Promise<TMetisSession<ClientUser>> {
    return new Promise<TMetisSession<ClientUser>>(
      (
        resolve: (session: TMetisSession<ClientUser>) => void,
        reject: (error: AxiosError) => void,
      ) => {
        // Send a request to fetch the session
        // data via the API.
        axios
          .get<TMetisSessionJSON>(`${ClientUser.API_ENDPOINT}/session`)
          .then((response: AxiosResponse<TMetisSessionJSON>) => {
            // Parse the response data.
            let sessionJson: TMetisSessionJSON = response.data
            let session: TMetisSession<ClientUser> = null

            // If the session JSON is not null,
            // parse the date.
            if (sessionJson !== null) {
              session = {
                user: new ClientUser(sessionJson.user),
                inGame: sessionJson.inGame,
              }
            }

            // Resolve the promise with the
            // session returned.
            resolve(session)
          })
          .catch((error: AxiosError) => {
            // If request fails, reject the promise
            // with the error given in the catch.
            console.log('Failed to retrieve session.')
            console.error(error)
            reject(error)
          })
      },
    )
  }

  // This will attempt to login in the user with the
  // given userID and password.

  /**
   * Attempts to log in the user with the given userID and password.
   * @param userID The user's ID to login with.
   * @param password The user's password to login with.
   * @returns {Promise<{ correct: boolean; session: TMetisSession<ClientUser> }>}
   * A promise that resolves to an object containing whether the login was correct and the session of the logged in user.
   */
  public static async login(
    userID: IUser['userID'],
    password: string,
  ): Promise<{
    correct: boolean
    session: TMetisSession<ClientUser>
  }> {
    return new Promise<{
      correct: boolean
      session: TMetisSession<ClientUser>
    }>((resolve, reject) => {
      axios
        .post(`${ClientUser.API_ENDPOINT}/login`, { userID, password })
        .then((response: AxiosResponse) => {
          // Parse the response data.
          let correct: boolean = response.data.correct
          let sessionJson: TMetisSessionJSON = response.data.session
          let session: TMetisSession<ClientUser> = null

          // If the session JSON is not null,
          // parse the date.
          if (sessionJson !== null) {
            session = {
              user: new ClientUser(sessionJson.user),
              inGame: sessionJson.inGame,
            }
          }

          resolve({ correct, session })
        })
        .catch((error: AxiosError) => {
          console.log('Failed to login user.')
          console.error(error)
          reject(error)
        })
    })
  }

  // This will logout the user in the session.

  /**
   * Logs out the user in the session.
   * @returns {Promise<void>} A promise that resolves when the user is logged out.
   */
  public static async logout(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      axios
        .post(`${ClientUser.API_ENDPOINT}/logout`)
        .then(() => ClientUser.fetchSession().then(() => resolve()))
        .catch((error: AxiosError) => {
          console.log('Failed to logout user.')
          console.error(error)
          reject(error)
        })
    })
  }

  /**
   * Calls the API to create a new user.
   * @param {ClientUser} user The user to create.
   * @returns {Promise<ClientUser>} A promise that resolves to the created user.
   */
  public static async create(user: ClientUser): Promise<ClientUser> {
    return new Promise<ClientUser>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: userJSON } = await axios.post<IUserJSON>(
          ClientUser.API_ENDPOINT,
          { user: user.toJSON({ password: user.password1 }) },
        )
        // Convert JSON to Client User object.
        let createdUser: ClientUser = new ClientUser(userJSON)
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
   * @param {ClientUser} user The user to update.
   * @returns {Promise<ClientUser>} A promise that resolves to the updated user.
   */
  public static async update(user: ClientUser): Promise<ClientUser> {
    return new Promise<ClientUser>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: userJSON } = await axios.put<IUserJSON>(
          ClientUser.API_ENDPOINT,
          { user: user.toJSON({ password: user.password1 }) },
        )
        // Convert JSON to Client User object.
        let updatedUser: ClientUser = new ClientUser(userJSON)
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
   * @param {ClientUser} user The user to reset the password of.
   * @returns {Promise<void>} A promise that resolves when the password is reset.
   */
  public static async resetPassword(user: ClientUser): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      axios
        .put(`${ClientUser.API_ENDPOINT}/reset-password`, {
          userID: user.userID,
          password: user.password1,
          needsPasswordReset: false,
        })
        .then(() => resolve())
        .catch((error: AxiosError) => {
          console.error('Failed to reset password.')
          console.error(error)
          reject(error)
        })
    })
  }

  /**
   * Calls the API to delete the user.
   * @param {IUser['userID']} userID The user ID of the user to delete.
   * @returns {Promise<void>} A promise that resolves when the user is deleted.
   */
  public static async delete(userID: IUser['userID']): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      axios
        .delete(`${ClientUser.API_ENDPOINT}?userID=${userID}`)
        .then(() => resolve())
        .catch((error: AxiosError) => {
          console.error('Failed to delete user.')
          console.error(error)
          reject(error)
        })
    })
  }
}
