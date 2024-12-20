import { TCommonUserJson } from 'metis/users'

// Default student user data.
export let studentUserData: TCommonUserJson = {
  username: 'student1',
  accessId: 'student',
  firstName: 'student',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'password',
}
// Default instructor user data.
export let instructorUserData: TCommonUserJson = {
  username: 'instructor1',
  accessId: 'instructor',
  firstName: 'instructor',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'password',
}
// Default admin user data.
export let adminUserData: TCommonUserJson = {
  username: 'admin',
  accessId: 'admin',
  firstName: 'admin',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'temppass',
}
