import axios, { AxiosResponse, AxiosError } from 'axios'
import { AnyObject } from './toolbox/objects'

export interface IUser {
  userID: string | null
  role: string | null
  firstName: string | null
  lastName: string | null
  needsPasswordReset: boolean
  password?: string
}

// This is the list of user roles.
export const userRoles = {
  Student: 'student',
  Instructor: 'instructor',
  Admin: 'admin',
}

export const defaultUserProps = {
  userID: null,
  firstName: null,
  lastName: null,
  role: null,
  needsPasswordReset: false,
}

// This is used to determine which roles
// can access certain routes.
export const restrictedAccessRoles: string[] = [
  userRoles.Admin,
  userRoles.Instructor,
]
export const fullAccessRoles: string[] = [userRoles.Admin]

export class User {
  public userID: string | null
  public firstName: string | null
  public lastName: string | null
  public role: string | null
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

  public constructor(
    userID: string | null,
    firstName: string | null,
    lastName: string | null,
    role: string | null,
    needsPasswordReset: boolean,
  ) {
    this.userID = userID
    this.firstName = firstName
    this.lastName = lastName
    this.role = role
    this.needsPasswordReset = needsPasswordReset
    this._passwordIsRequired = false
  }

  public static defaultUser: User = new User(
    defaultUserProps.userID,
    defaultUserProps.firstName,
    defaultUserProps.lastName,
    defaultUserProps.role,
    defaultUserProps.needsPasswordReset,
  )

  public get canSave(): boolean {
    // userID cannot be the default value
    let updatedUserID: boolean = this.userID !== defaultUserProps.userID
    // firstName cannot be the default value
    let updatedFirstName: boolean =
      this.firstName !== defaultUserProps.firstName
    // lastName cannot be the default value
    let updatedLastName: boolean = this.lastName !== defaultUserProps.lastName
    // role cannot be the default value
    let updatedRole: boolean = this.role !== defaultUserProps.role
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
      !password2IsEmptyString
    )
  }

  public toJSON(): IUser {
    // Construct JSON object to send to server.
    let JSON: IUser = {
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

  public importJSON(JSON: IUser): void {
    // Set properties with JSON.
    this.userID = JSON.userID
    this.firstName = JSON.firstName
    this.lastName = JSON.lastName
    this.role = JSON.role
    this.needsPasswordReset = JSON.needsPasswordReset
  }

  /**
   * Creates a new User object from the given JSON.
   * @param {IUser} JSON The JSON from which to create a User object.
   * @returns {User} A new User object.
   */
  public static fromJSON(JSON: IUser): User {
    // Create new user object.
    let user: User = User.defaultUser

    // Import JSON into the new user object.
    user.importJSON(JSON)

    // Return the new user object.
    return user
  }
}

// This loads the currently logged in user in the
// session.
export const retrieveCurrentUser = (
  callback: (currentUser: User | null) => void = () => {
    /* does nothing if function is not passed */
  },
  callbackError: (error: AxiosError) => void = () => {
    /* does nothing if function is not passed */
  },
): void => {
  axios
    .get('/api/v1/users/session')
    .then((response: AxiosResponse) => {
      let currentUser = response.data.currentUser

      callback(currentUser)
    })
    .catch((error: AxiosError) => {
      console.log('Failed to retrieve current user.')
      callbackError(error)
    })
}

// This will attempt to login in the user with the
// given userID and password.
export const login = (
  userID: string,
  password: string,
  callback: (correct: boolean, currentUser: User | null) => void = () => {
    /* does nothing if function is not passed */
  },
  callbackError: (error: AxiosError) => void = () => {
    /* does nothing if function is not passed */
  },
) => {
  axios
    .post('/api/v1/users/login', { userID, password })
    .then((response: AxiosResponse) => {
      let correct: boolean = response.data.correct
      let currentUser: User | null = response.data.currentUser

      return callback(correct, currentUser)
    })
    .catch((error: AxiosError) => {
      console.log('Failed to login user.')
      callbackError(error)
    })
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
      retrieveCurrentUser(callback)
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
      let createdUser: User = User.fromJSON(userJSON)
      callback(createdUser)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to create user.')
      callbackError(error)
    })
}

// This will get all users.
export const getAllUsers = (
  callback: (users: User[]) => void,
  callbackError: (error: AxiosError) => void = () => {},
): void => {
  axios
    .get(`/api/v1/users/`)
    .then((response: AxiosResponse<AnyObject>): void => {
      let users = response.data.users

      callback(users)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to get all users.')
      callbackError(error)
    })
}

// This will get a user by their userID.
export const getUser = (
  userID: string,
  callback: (user: User) => void,
  callbackError: (error: AxiosError) => void = () => {},
): void => {
  axios
    .get(`/api/v1/users?userID=${userID}`)
    .then((response: AxiosResponse<AnyObject>): void => {
      let userJSON = response.data.user
      let user: User = User.fromJSON(userJSON)
      callback(user)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to get user.')
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

export default {
  User,
  retrieveCurrentUser,
  login,
  logout,
  createUser,
  getAllUsers,
  getUser,
  saveUser,
  deleteUser,
}
