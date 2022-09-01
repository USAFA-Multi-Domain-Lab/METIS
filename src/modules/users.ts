import axios, { AxiosResponse, AxiosError } from 'axios'

export interface IUser {
  firstName: string
  lastName: string
  userID: string
  type: string
}

export interface IUserExposed {
  firstName: string
  lastName: string
  userID: string
  password: string
}

// This loads the currently logged in user in the
// session.
const retrieveCurrentUser = (
  callback: (currentUser: IUser | null) => void = () => {
    /* does nothing if function is not passed */
  },
  callbackError: (error: AxiosError) => void = () => {
    /* does nothing if function is not passed */
  },
): void => {
  axios
    .get('/api/v1/users/')
    .then((response: AxiosResponse) => {
      let currentUser = response.data.currentUser
      callback(currentUser)
    })
    .catch((error: AxiosError) => {
      console.log('Failed to retrieve current user.')
      console.error(error)
      callbackError(error)
    })
}

// This will attempt to login in the user with the
// given userID and password.
const login = (
  userID: string,
  password: string,
  callback: (currentUser: IUser | null) => void = () => {
    /* does nothing if function is not passed */
  },
  callbackError: (error: AxiosError) => void = () => {
    /* does nothing if function is not passed */
  },
) => {
  axios
    .post('/api/v1/users/login', { userID, password })
    .then((response: AxiosResponse) => {
      retrieveCurrentUser(callback)
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
      retrieveCurrentUser(callback)
    })
    .catch((error: AxiosError) => {
      console.log('Failed to logout user.')
      console.error(error)
      callbackError(error)
    })
}

export default {
  retrieveCurrentUser,
  login,
  logout,
}
