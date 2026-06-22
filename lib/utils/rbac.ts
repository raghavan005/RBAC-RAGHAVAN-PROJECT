export const permissions = {
  "view-members": ["admin", "manager", "member"],
  "create-member": ["admin", "manager"],
  "edit-member": ["admin", "manager"],
  "delete-member": ["admin"],
} as const;

export type Permission = keyof typeof permissions;

export function hasPermission(role: string | undefined, permission: Permission) {
  if (!role) return false;
  return (permissions[permission] as readonly string[]).includes(role);
}

export function requireRole(role: string, allowedRoles: string[]) {
  return allowedRoles.includes(role);
}
