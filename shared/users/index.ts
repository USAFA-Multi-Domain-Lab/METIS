import axios, { AxiosResponse, AxiosError } from 'axios'
import { AnyObject } from 'metis/toolbox/objects'
import { TMetisSession, TMetisSessionJSON } from '../sessions'

/**
 * The JSON representation of a User object.
 */
export interface IUserJSON {
  userID: string
  firstName: string
  lastName: string
  role: TUserRole
  needsPasswordReset: boolean
  password?: string
}

/**
 * Options for creating new User objects.
 */
export interface IUserOptions {
  /**
   * Whether the password is required when saving. Defaults to false.
   */
  passwordIsRequired?: boolean
}

export interface IUserJSONExposed {
  firstName: string
  lastName: string
  userID: string
  password: string
}

/**
 * All possible user roles in METIS.
 */
export type TUserRole = 'Select a role' | 'student' | 'instructor' | 'admin'

/**
 * Represents a user using METIS.
 */
export default class User {
  public userID: string
  public firstName: string
  public lastName: string
  public role: TUserRole
  public needsPasswordReset: boolean

  public password1: string | undefined
  public password2: string | undefined

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
   * This makes sure password 1 meets
   * the correct criteria.
   */
  public get hasValidPassword1(): boolean {
    let passwordRegex: RegExp = new RegExp(/^([^\s]{8,50})$/)
    return this.password1 ? passwordRegex.test(this.password1) : false
  }

  /**
   * This makes sure password 2 meets
   * the correct criteria.
   */
  public get hasValidPassword2(): boolean {
    let passwordRegex: RegExp = new RegExp(/^([^\s]{8,50})$/)
    return this.password2 ? passwordRegex.test(this.password2) : false
  }

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
      this.hasValidPassword1 &&
      this.hasValidPassword2
    )
  }

  /**
   * @returns {boolean} Whether the user has restricted access.
   */
  public get hasRestrictedAccess(): boolean {
    return User.RESTRICTED_ACCESS_ROLES.includes(this.role)
  }

  /**
   * @returns {boolean} Whether the user has full access.
   */
  public get hasFullAccess(): boolean {
    return User.FULL_ACCESS_ROLES.includes(this.role)
  }

  /**
   * @param {IUserJSON} data The user data from which to create the user. Any ommitted values will be set to the default properties defined in User.DEFAULT_PROPERTIES.
   * @param {IUserOptions} options Options for creating the user.
   */
  public constructor(
    data: Partial<IUserJSON> = User.DEFAULT_PROPERTIES,
    options: IUserOptions = {},
  ) {
    this.userID = data.userID ?? User.DEFAULT_PROPERTIES.userID
    this.firstName = data.firstName ?? User.DEFAULT_PROPERTIES.firstName
    this.lastName = data.lastName ?? User.DEFAULT_PROPERTIES.lastName
    this.role = data.role ?? User.DEFAULT_PROPERTIES.role
    this.needsPasswordReset =
      data.needsPasswordReset ?? User.DEFAULT_PROPERTIES.needsPasswordReset
    this._passwordIsRequired = options.passwordIsRequired ?? false
  }

  /**
   * Converts the User object to JSON.
   * @returns {IUserJSON} A JSON representation of the user.
   */
  public toJSON(): IUserJSON {
    // Construct JSON object to send to server.
    let JSON: IUserJSON = {
      userID: this.userID,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      needsPasswordReset: this.needsPasswordReset,
    }

    // Only add password if it is required.
    if (this.password1 !== undefined) {
      JSON.password = this.password1
    }

    return JSON
  }

  public importJSON(JSON: IUserJSON): void {
    // Set properties with JSON.
    this.userID = JSON.userID
    this.firstName = JSON.firstName
    this.lastName = JSON.lastName
    this.role = JSON.role
    this.needsPasswordReset = JSON.needsPasswordReset
  }

  /**
   * The API endpoint for managing users.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/users'

  /**
   * Default properties set when creating a new user.
   */
  public static readonly DEFAULT_PROPERTIES: IUserJSON = {
    userID: '',
    firstName: '',
    lastName: '',
    role: 'Select a role',
    needsPasswordReset: false,
  }
  /**
   * All available roles in METIS.
   */
  public static readonly AVAIABLE_ROLES: TUserRole[] = [
    'student',
    'instructor',
    'admin',
  ]
  /**
   * The roles that have restricted access to certain pages.
   */
  public static readonly RESTRICTED_ACCESS_ROLES: TUserRole[] = [
    'instructor',
    'admin',
  ]
  /**
   * The roles that have full access to all pages.
   */
  public static readonly FULL_ACCESS_ROLES: string[] = ['admin']

  /**
   * Calls the API to fetch one user by their user ID.
   * @param {string} userID The user ID of the user to fetch.
   * @returns {Promise<User>} A promise that resolves to a User object.
   */
  public static async fetchOne(userID: string): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: userJSON } = await axios.get<IUserJSON>(
          `${User.API_ENDPOINT}`,
          { params: { userID } },
        )
        // Convert JSON to User object.
        let user: User = new User(userJSON)
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
   * @returns {Promise<Array<User>>} A promise that resolves to an array of User objects.
   */
  public static async fetchAll(): Promise<Array<User>> {
    return new Promise<Array<User>>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: usersJSON } = await axios.get<Array<IUserJSON>>(
          User.API_ENDPOINT,
        )
        // Convert JSON to User objects.
        let users: Array<User> = usersJSON.map((userJSON) => new User(userJSON))
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
   * @returns {Promise<TMetisSession>} A promise that resolves to the current session of the logged in user.
   */
  public static async fetchSession(): Promise<TMetisSession> {
    return new Promise<TMetisSession>(
      (
        resolve: (session: TMetisSession) => void,
        reject: (error: AxiosError) => void,
      ) => {
        // Send a request to fetch the session
        // data via the API.
        axios
          .get<TMetisSessionJSON>(`${User.API_ENDPOINT}/session`)
          .then((response: AxiosResponse<TMetisSessionJSON>) => {
            // Parse the response data.
            let sessionJson: TMetisSessionJSON = response.data
            let session: TMetisSession = null

            // If the session JSON is not null,
            // parse the date.
            if (sessionJson !== null) {
              session = {
                user: new User(sessionJson.user),
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
  public static async login(
    userID: string,
    password: string,
  ): Promise<{ correct: boolean; session: TMetisSession }> {
    return new Promise<{ correct: boolean; session: TMetisSession }>(
      (resolve, reject) => {
        axios
          .post(`${User.API_ENDPOINT}/login`, { userID, password })
          .then((response: AxiosResponse) => {
            // Parse the response data.
            let correct: boolean = response.data.correct
            let sessionJson: TMetisSessionJSON = response.data.session
            let session: TMetisSession = null

            // If the session JSON is not null,
            // parse the date.
            if (sessionJson !== null) {
              session = {
                user: new User(sessionJson.user),
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
      },
    )
  }
}

// This will logout the user in the session.
export const logout = (
  callback: () => void = () => {
    /* does nothing if function is not passed */
  },
  callbackError: (error: AxiosError) => void = () => {
    /* does nothing if function is not passed */
  },
) => {
  axios
    .post('/api/v1/users/logout')
    .then(() => {
      User.fetchSession().then(callback)
    })
    .catch((error: AxiosError) => {
      console.log('Failed to logout user.')
      callbackError(error)
    })
}

// This will create a brand new user.
export const createUser = (
  user: User,
  callback: (user: User) => void,
  callbackError: (error: AxiosError) => void = () => {},
): void => {
  axios
    .post(`/api/v1/users/`, { user: user })
    .then((response: AxiosResponse<AnyObject>): void => {
      let userJSON = response.data.user
      let createdUser: User = new User(userJSON)
      callback(createdUser)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to create user.')
      callbackError(error)
    })
}

// This will update the given user to
// the server.
export const saveUser = (
  user: User,
  callback: () => void,
  callbackError: (error: AxiosError) => void = () => {},
): void => {
  axios
    .put(`/api/v1/users/`, { user: user.toJSON() })
    .then(callback)
    .catch((error: AxiosError) => {
      console.error('Failed to save user.')
      callbackError(error)
    })
}

// This will delete the user with
// the given userID.
export const deleteUser = (
  userID: string,
  callback: () => void,
  callbackError: (error: AxiosError) => void = () => {},
): void => {
  axios
    .delete(`/api/v1/users?userID=${userID}`)
    .then(callback)
    .catch((error: AxiosError) => {
      console.error('Failed to delete user.')
      callbackError(error)
    })
}
