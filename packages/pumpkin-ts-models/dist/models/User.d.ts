/**
 * User role enumeration
 */
export declare enum UserRole {
    SuperAdmin = "SuperAdmin",
    TenantAdmin = "TenantAdmin",
    Editor = "Editor",
    Viewer = "Viewer"
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
    createdDate: string;
    lastLogin?: string;
    permissions: string[];
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
    expiresAt: string;
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
export declare function userRoleToString(role: UserRole): string;
/**
 * Helper function to parse string to UserRole enum
 */
export declare function stringToUserRole(role: string): UserRole;
/**
 * Type guard to check if a value is a valid UserRole
 */
export declare function isUserRole(value: any): value is UserRole;
/**
 * Create a sanitized UserInfo from a User object
 */
export declare function userToUserInfo(user: User): UserInfo;
//# sourceMappingURL=User.d.ts.map