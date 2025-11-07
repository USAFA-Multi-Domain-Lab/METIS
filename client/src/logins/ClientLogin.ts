import { ClientUser } from '@client/users/ClientUser'
import type { TLogin, TLoginJson } from '@shared/logins'
import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'

export class ClientLogin {
  /**
   * Fetches the current information of the logged in user from the server.
   * @resolves The information of the logged in user.
   * @rejects The error that occurred while fetching the login information.
   */
  public static $fetchLoginInfo(): Promise<TLogin<ClientUser>> {
    return new Promise<TLogin<ClientUser>>(
      async (
        resolve: (login: TLogin<ClientUser>) => void,
        reject: (error: AxiosError) => void,
      ) => {
        try {
          let { data: loginJson } = await axios.get<TLoginJson>(
            `${ClientLogin.API_ENDPOINT}/`,
          )
          let login: TLogin<ClientUser> = null

          // If the login JSON is not null,
          // parse the data.
          if (loginJson !== null) {
            login = {
              user: ClientUser.fromExistingJson(loginJson.user),
              sessionId: loginJson.sessionId,
            }
          }

          // Resolve the promise with the
          // login information returned.
          resolve(login)
        } catch (error: any) {
          // If request fails, reject the promise
          // with the error given in the catch.
          console.error('Failed to retrieve login information.')
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
   * @param forceful Whether to force logout any other client logged in.
   * @resolves The object containing whether the login was correct and the information of the logged in user.
   * @rejects The error that occurred while logging in.
   */
  public static $logIn(
    username: ClientUser['username'],
    password: string,
    forceful: boolean = false,
  ): Promise<{
    login: TLogin<ClientUser>
  }> {
    return new Promise<{
      login: TLogin<ClientUser>
    }>(async (resolve, reject) => {
      try {
        let response: AxiosResponse = await axios.post<TLoginJson>(
          `${ClientLogin.API_ENDPOINT}/`,
          { username, password },
          { headers: { forceful } },
        )

        // Parse the response data.
        let loginJson: TLoginJson = response.data.login
        let login: TLogin<ClientUser> = null

        // If the login JSON is not null,
        // parse the date.
        if (loginJson !== null) {
          login = {
            user: ClientUser.fromExistingJson(loginJson.user),
            sessionId: loginJson.sessionId,
          }
        }

        resolve({ login })
      } catch (error: any) {
        console.error('Failed to login user.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Logs out the user currently logged in.
   * @param forceful Whether to force logout any other client logged in.
   * @resolves When the user is logged out.
   * @rejects The error that occurred while logging out.
   */
  public static $logOut(forceful: boolean = false): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await axios.delete(`${ClientLogin.API_ENDPOINT}/`, {
          headers: { forceful },
        })
        await ClientLogin.$fetchLoginInfo()
        resolve()
      } catch (error: any) {
        console.error('Failed to logout user.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * The API endpoint for Login Objects.
   */
  public static readonly API_ENDPOINT: string = 'api/v1/logins'
}
