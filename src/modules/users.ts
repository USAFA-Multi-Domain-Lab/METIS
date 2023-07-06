import axios, { AxiosResponse, AxiosError } from 'axios'
import { AnyObject } from './toolbox/objects'
import { IMissionJSON, IMissionSessionJSON, Mission } from './missions'

/**
 * The JSON representation of a User object.
 */
export interface IUserJSON {
  userID: string
  firstName: string
  lastName: string
  role: string
}

/**
 * The JSON representation of a MetisSession object.
 */
export interface IMetisSessionJSON {
  user: IUserJSON
  mission?: IMissionJSON
}

export interface IMetisSession {
  user: User
  mission?: Mission
}

/**
 * Represents a user using METIS.
 */
export class User {
  public userID: string
  public firstName: string
  public lastName: string
  public role: string

  /**
   * @param userID {string} The user's ID.
   * @param firstName {string} The user's first name.
   * @param lastName {string} The user's last name.
   * @param role {string} The user's role (student, instructor, admin).
   */
  public constructor(
    userID: string,
    firstName: string,
    lastName: string,
    role: string,
  ) {
    this.userID = userID
    this.role = role
    this.firstName = firstName
    this.lastName = lastName
  }

  /**
   * Converts the User object to JSON.
   * @returns {IUserJSON} A JSON representation of the user.
   */
  public toJSON(): IUserJSON {
    return {
      userID: this.userID,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
    }
  }

  /**
   * Converts IMissionJSON into a Mission object.
   * @param {IMissionJson} json The json to be converted.
   * @returns {Mission} The Mission object.
   */
  static fromJSON(json: IUserJSON): any {
    return new User(json.userID, json.firstName, json.lastName, json.role)
  }
}

export interface IUserExposed {
  firstName: string
  lastName: string
  userID: string
  password: string
}

// This is the list of user roles.
export const userRoles: AnyObject = {
  Student: 'student',
  Admin: 'admin',
}

// This is used to determine which roles
// can access certain routes.
export const permittedRoles: string[] = [userRoles.Admin]

// Retrieves information regarding the current session.
export const retrieveSession = (
  callback: (
    user: User | undefined,
    mission: Mission | undefined,
  ) => void = () => {
    /* does nothing if function is not passed */
  },
  callbackError: (error: AxiosError) => void = () => {
    /* does nothing if function is not passed */
  },
): void => {
  axios
    .get('/api/v1/users/session/')
    .then((response: AxiosResponse) => {
      let userJson: IUserJSON | undefined = response.data.user
      let missionJson: IMissionJSON | undefined = response.data.mission
      let user: User | undefined = userJson
        ? User.fromJSON(userJson)
        : undefined
      let mission: Mission | undefined = missionJson
        ? Mission.fromJSON(missionJson)
        : undefined

      callback(user, mission)
    })
    .catch((error: AxiosError) => {
      console.log('Failed to retrieve session.')
      console.error(error)
      callbackError(error)
    })
}

// This will attempt to login in the user with the
// given userID and password.
const login = (
  userID: string,
  password: string,
  callback: (
    correct: boolean,
    user: User | undefined,
    mission: Mission | undefined,
  ) => void = () => {
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
      let userJson: IUserJSON | undefined = response.data.session.user
      let missionJson: IMissionJSON | undefined = response.data.session.mission
      let user: User | undefined = userJson
        ? User.fromJSON(userJson)
        : undefined
      let mission: Mission | undefined = missionJson
        ? Mission.fromJSON(missionJson)
        : undefined

      callback(correct, user, mission)
    })
    .catch((error: AxiosError) => {
      console.log('Failed to login user.')
      console.error(error)
      callbackError(error)
    })
}

// This will logout the user in the session.
const logout = (
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
      retrieveSession(callback)
    })
    .catch((error: AxiosError) => {
      console.log('Failed to logout user.')
      console.error(error)
      callbackError(error)
    })
}

export default {
  retrieveSession,
  login,
  logout,
}
