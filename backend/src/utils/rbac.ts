export const permissions = {
  "view-members": ["admin", "manager", "member"],
  "create-member": ["admin", "manager"],
  "edit-member": ["admin", "manager"],
  "delete-member": ["admin"],
  "view-audit-logs": ["admin"],
} as const;

export type Permission = keyof typeof permissions;

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (permissions[permission] as readonly string[]).includes(role);
}
