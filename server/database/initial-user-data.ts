import { IUserJSON } from 'metis/users'
import { IUserPermissionJSON } from 'metis/users/permissions'
import { IUserRoleJSON } from 'metis/users/roles'

// Default user permissions.
export const permissionData: IUserPermissionJSON[] = [
  {
    id: 'READ',
  },
  {
    id: 'WRITE',
  },
  {
    id: 'DELETE',
  },
]
// Default user roles.
export const roleData: IUserRoleJSON[] = [
  {
    id: 'student',
  },
  {
    id: 'instructor',
  },
  {
    id: 'admin',
  },
]
// Default student user data.
export let studentUserData: IUserJSON = {
  userID: 'student1',
  role: roleData[0],
  firstName: 'student',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissions: [],
  password: 'password',
}
// Default instructor user data.
export let instructorUserData: IUserJSON = {
  userID: 'instructor1',
  role: roleData[1],
  firstName: 'instructor',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissions: [],
  password: 'password',
}
// Default admin user data.
export let adminUserData: IUserJSON = {
  userID: 'admin',
  role: roleData[2],
  firstName: 'admin',
  lastName: 'user',
  needsPasswordReset: false,
  expressPermissions: [],
  password: 'temppass',
}
