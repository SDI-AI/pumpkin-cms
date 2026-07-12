"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
exports.userRoleToString = userRoleToString;
exports.stringToUserRole = stringToUserRole;
exports.isUserRole = isUserRole;
exports.userToUserInfo = userToUserInfo;
/**
 * User role enumeration
 */
var UserRole;
(function (UserRole) {
    UserRole["SuperAdmin"] = "SuperAdmin";
    UserRole["TenantAdmin"] = "TenantAdmin";
    UserRole["Editor"] = "Editor";
    UserRole["Viewer"] = "Viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * Helper function to convert UserRole enum to string
 */
function userRoleToString(role) {
    return role;
}
/**
 * Helper function to parse string to UserRole enum
 */
function stringToUserRole(role) {
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
function isUserRole(value) {
    return Object.values(UserRole).includes(value);
}
/**
 * Create a sanitized UserInfo from a User object
 */
function userToUserInfo(user) {
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
//# sourceMappingURL=User.js.map