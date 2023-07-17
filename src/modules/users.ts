import axios, { AxiosResponse, AxiosError } from 'axios'
import { AnyObject } from './toolbox/objects'

export interface IUser {
  userID: string
  role: string
  firstName: string
  lastName: string
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
  Instructor: 'instructor',
  Admin: 'admin',
}

// This is used to determine which roles
// can access certain routes.
export const restrictedAccessRoles: string[] = [
  userRoles.Admin,
  userRoles.Instructor,
]
export const fullAccessRoles: string[] = [userRoles.Admin]

export class User {
  public userID: string
  public firstName: string
  public lastName: string
  public role: string

  public constructor(
    userID: string,
    firstName: string,
    lastName: string,
    role: string,
  ) {
    this.userID = userID
    this.firstName = firstName
    this.lastName = lastName
    this.role = role
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
      console.error(error)
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
      console.error(error)
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
      console.error(error)
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

      let createdUser = new User(
        userJSON.userID,
        userJSON.firstName,
        userJSON.lastName,
        userJSON.role,
      )

      callback(createdUser)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to create user.')
      console.error(error)
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
      console.error(error)
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
      let user = response.data.user

      callback(user)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to get user.')
      console.error(error)
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
    .put(`/api/v1/users/`, { user: user })
    .then(callback)
    .catch((error: AxiosError) => {
      console.error('Failed to save user.')
      console.error(error)
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
      console.error(error)
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
  updateUser: saveUser,
  deleteUser,
}
