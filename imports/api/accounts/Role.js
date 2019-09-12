import { Group } from './Group'

export const Role = {}

/**
 * represent a field user but for testing purposes
 */

Role.test = {
  value: 'test',
  compatible: [ Group.field.value ]
}

/**
 * Reprersents a user that can run a session.
 * Team and admin for example can't run sessions
 * but field users and test field users.
 */

Role.runSession = {
  value: 'runSession',
  compatible: [ Group.field.value ]
}

/**
 * Can create, read, write, update, delete a user for testing purposes
 */
Role.crudTestUsers = {
  value: 'crudTestUsers',
  compatible: [ Group.team.value, Group.admin.value ]
}

/**
 * Can create, read, write, update, delete a core team users.
 * Admins by default, but can be delegated to team members
 */
Role.crudTeamUsers = {
  value: 'crudTeamUsers',
  compatible: [ Group.admin.value ],
  optional: [ Group.team.value ]
}

/**
 * Can manage roles of other users. Admins by default, but can be delegated to team members
 */
Role.manageRoles = {
  value: 'manageRoles',
  compatible: [ Group.admin.value ],
  optional: [ Group.team.value ]
}

/**
 * Only admins can manage admins
 */
Role.manageAdmins = {
  value: 'manageAdmins',
  compatible: [ Group.admin.value ]
}
