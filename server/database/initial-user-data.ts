import { TCommonUserJson } from 'metis/users'

// Default student user data.
export const studentUserData: Omit<TCommonUserJson, '_id'> = {
  username: 'student1',
  accessId: 'student',
  firstName: 'student',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'password',
}
// Default instructor user data.
export const instructorUserData: Omit<TCommonUserJson, '_id'> = {
  username: 'instructor1',
  accessId: 'instructor',
  firstName: 'instructor',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'password',
}
// Default admin user data.
export const adminUserData: Omit<TCommonUserJson, '_id'> = {
  username: 'admin',
  accessId: 'admin',
  firstName: 'admin',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'temppass',
}
