/**
 * User role enumeration
 */
export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  TenantAdmin = 'TenantAdmin',
  Editor = 'Editor',
  Viewer = 'Viewer'
}

/**
 * Main user model
 */
export interface User {
  id: string;
  tenantId: string;
  email: string;
  username: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  createdDate: string; // ISO 8601 date string
  lastLogin?: string; // ISO 8601 date string
  permissions: string[];
  
  // Cosmos DB specific - must match tenantId for partitioning
  partitionKey: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response payload
 */
export interface LoginResponse {
  token: string;
  user: UserInfo;
  expiresAt: string; // ISO 8601 date string
}

/**
 * User information (sanitized, no password hash)
 */
export interface UserInfo {
  id: string;
  tenantId: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: string[];
}

/**
 * Helper function to convert UserRole enum to string
 */
export function userRoleToString(role: UserRole): string {
  return role;
}

/**
 * Helper function to parse string to UserRole enum
 */
export function stringToUserRole(role: string): UserRole {
  switch (role) {
    case 'SuperAdmin':
      return UserRole.SuperAdmin;
    case 'TenantAdmin':
      return UserRole.TenantAdmin;
    case 'Editor':
      return UserRole.Editor;
    case 'Viewer':
      return UserRole.Viewer;
    default:
      return UserRole.Viewer;
  }
}

/**
 * Type guard to check if a value is a valid UserRole
 */
export function isUserRole(value: any): value is UserRole {
  return Object.values(UserRole).includes(value);
}

/**
 * Create a sanitized UserInfo from a User object
 */
export function userToUserInfo(user: User): UserInfo {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: userRoleToString(user.role),
    permissions: [...user.permissions]
  };
}
