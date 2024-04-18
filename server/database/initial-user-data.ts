import { TCommonUserJson } from 'metis/users'

// Default student user data.
export const studentUserData: Omit<TCommonUserJson, '_id'> = {
  username: 'student1',
  roleId: 'student',
  firstName: 'student',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'password',
}
// Default instructor user data.
export const instructorUserData: Omit<TCommonUserJson, '_id'> = {
  username: 'instructor1',
  roleId: 'instructor',
  firstName: 'instructor',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'password',
}
// Default admin user data.
export const adminUserData: Omit<TCommonUserJson, '_id'> = {
  username: 'admin',
  roleId: 'admin',
  firstName: 'admin',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'temppass',
}
