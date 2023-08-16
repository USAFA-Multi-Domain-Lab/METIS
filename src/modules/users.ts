import axios, { AxiosResponse, AxiosError } from 'axios'
import { AnyObject } from './toolbox/objects'
import { IMissionJSON, IMissionSessionJSON, Mission } from './missions'
import { Game, IGameJSON } from './games'

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
export type TMetisSessionJSON = {
  user: IUserJSON
  inGame: boolean
} | null

export type TMetisSession = {
  user: User
  inGame: boolean
} | null

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
   * The API endpoint for managing users.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/users'

  /**
   * Converts IMissionJSON into a Mission object.
   * @param {IMissionJson} json The json to be converted.
   * @returns {Mission} The Mission object.
   */
  public static fromJSON(json: IUserJSON): any {
    return new User(json.userID, json.firstName, json.lastName, json.role)
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
                user: User.fromJSON(sessionJson.user),
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
                user: User.fromJSON(sessionJson.user),
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
      console.error(error)
      callbackError(error)
    })
}

export default {
  logout,
}
