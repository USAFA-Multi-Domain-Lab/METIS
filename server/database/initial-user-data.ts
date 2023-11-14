import { TUserJSON } from 'metis/users'

// Default student user data.
export const studentUserData: TUserJSON = {
  userID: 'student1',
  roleID: 'student',
  firstName: 'student',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIDs: [],
  password: 'password',
}
// Default instructor user data.
export const instructorUserData: TUserJSON = {
  userID: 'instructor1',
  roleID: 'instructor',
  firstName: 'instructor',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIDs: [],
  password: 'password',
}
// Default admin user data.
export const adminUserData: TUserJSON = {
  userID: 'admin',
  roleID: 'admin',
  firstName: 'admin',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIDs: [],
  password: 'temppass',
}
