import { TUserJson } from 'metis/users'

// Default student user data.
export let studentUserData: TUserJson = {
  username: 'student1',
  accessId: 'student',
  firstName: 'student',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'password',
}
// Default instructor user data.
export let instructorUserData: TUserJson = {
  username: 'instructor1',
  accessId: 'instructor',
  firstName: 'instructor',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'password',
}
// Default admin user data.
export let adminUserData: TUserJson = {
  username: 'admin',
  accessId: 'admin',
  firstName: 'admin',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissionIds: [],
  password: 'temppass',
}
