export const APP_ROLES = ["staff", "admin", "superadmin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export function hasAdminAccess(role: AppRole): boolean {
  return role === "admin" || role === "superadmin";
}
