import { NextFunction, Request, Response } from 'express-serve-static-core'
import expressWs from 'express-ws'
import UserModel from 'metis/server/database/models/users'
import { StatusError } from 'metis/server/http'
import { TMetisRouterMap } from 'metis/server/http/router'
import ServerLogin from 'metis/server/logins'
import defineRequests, {
  RequestBodyFilters,
} from 'metis/server/middleware/requests'
import SessionServer from 'metis/server/sessions'
import ServerUser from 'metis/server/users'

const routerMap: TMetisRouterMap = (router: expressWs.Router, done) => {
  /* ---------------------------- CREATE ---------------------------- */
  /**
   * This will log the user in.
   * @returns The login information in JSON format.
   */
  const login = (request: Request, response: Response) => {
    UserModel.authenticate(
      request,
      (error: StatusError, correct: boolean, userData: any) => {
        // If there was an error, return the
        // error as a response.
        if (error) {
          return response.sendStatus(error.status ? error.status : 500)
        }
        // Else, check if the username and password
        // were correct.
        else {
          let json: any = { correct, login: null }

          // If correct, generate a new login object.
          if (correct) {
            // Create a new user object.
            let user: ServerUser = new ServerUser(userData)

            try {
              // Attempt to create a new login object.
              let login: ServerLogin = new ServerLogin(user)

              // Store the logged in user's ID in the express
              // session.
              request.session.userId = login.userId

              // Store the login data in the response
              // json.
              json.login = login.toJson()
            } catch (error) {
              // if the user is already logged in on another device
              // or browser, return a 409.
              return response.sendStatus(409)
            }
          }
          return response.json(json)
        }
      },
    )
  }

  /* ---------------------------- READ ---------------------------- */

  /**
   * This will return the login information for the user making the request.
   * @returns The login information in JSON format or null if the login information was not found.
   */
  const getLogin = (request: Request, response: Response) => {
    // Retrieve the login information with the user
    // ID stored in the request.
    let login: ServerLogin | undefined = ServerLogin.get(request.session.userId)

    // If the login information was not found, return
    // an empty object.
    if (login === undefined) {
      return response.json(null)
    }
    // Otherwise, convert and return the login information
    // as JSON.
    else {
      return response.json(login.toJson())
    }
  }

  /* ---------------------------- DELETE ---------------------------- */

  /**
   * This will log the user out.
   * @returns 200 response if the user was logged out successfully.
   */
  const logout = (request: Request, response: Response, next: NextFunction) => {
    // If the express session exists.
    if (request.session) {
      // Get the login information.
      let login: ServerLogin | undefined = ServerLogin.get(
        request.session.userId,
      )

      // If the logged in user is in a session,
      // then remove them from the session.
      if (login && login.sessionId && login.inSession) {
        // Get the session.
        let session = SessionServer.get(login.sessionId)
        // Remove the user from the session.
        session?.quit(login.userId)
      }

      // Log the user out by destroying the login.
      ServerLogin.destroy(request.session.userId)

      // Then destroy the Express session.
      request.session.destroy((error) => {
        if (error) {
          return next(error)
        }
        return response.sendStatus(200)
      })
    }
  }

  /* ---------------------------- ROUTES ---------------------------- */

  // -- GET | /api/v1/logins/ --
  router.get('/', getLogin)

  // -- POST | /api/v1/logins/ --
  router.post(
    '/',
    defineRequests({
      body: {
        username: RequestBodyFilters.USERNAME,
        password: RequestBodyFilters.PASSWORD,
      },
    }),
    login,
  )

  // -- DELETE | /api/v1/logouts/ --
  router.delete('/', logout)

  done()
}

export default routerMap
