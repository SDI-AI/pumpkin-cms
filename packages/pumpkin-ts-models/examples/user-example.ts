/**
 * Example demonstrating User model usage
 * 
 * This example shows how to work with User, UserRole, and authentication models
 */

import { 
  User, 
  UserRole, 
  UserInfo, 
  LoginRequest, 
  LoginResponse,
  userToUserInfo,
  stringToUserRole,
  isUserRole 
} from '../src/index';

// Example 1: Create a User object
console.log('=== Creating a User ===\n');

const user: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  tenantId: 'tenant-abc',
  email: 'john.doe@example.com',
  username: 'johndoe',
  passwordHash: '$2b$10$...',  // In practice, this would be a bcrypt hash
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.Editor,
  isActive: true,
  createdDate: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  permissions: ['pages:read', 'pages:write', 'pages:delete'],
  partitionKey: 'tenant-abc'
};

console.log('User created:', {
  username: user.username,
  email: user.email,
  role: user.role,
  permissions: user.permissions
});

// Example 2: Convert User to UserInfo (sanitized)
console.log('\n=== Converting User to UserInfo ===\n');

const userInfo: UserInfo = userToUserInfo(user);
console.log('UserInfo (no password):', userInfo);

// Example 3: Working with UserRole enum
console.log('\n=== Working with UserRole ===\n');

const roles = Object.values(UserRole);
console.log('Available roles:', roles);

// Check if a string is a valid role
const testRoles = ['Editor', 'Admin', 'Viewer', 'InvalidRole'];
testRoles.forEach(role => {
  console.log(`Is "${role}" a valid role? ${isUserRole(role)}`);
});

// Convert string to UserRole
const roleString = 'TenantAdmin';
const role = stringToUserRole(roleString);
console.log(`\nConverted "${roleString}" to:`, role);

// Example 4: Login Request and Response
console.log('\n=== Authentication Flow ===\n');

const loginRequest: LoginRequest = {
  email: 'john.doe@example.com',
  password: 'SecurePassword123!'
};

console.log('Login request:', loginRequest);

// Simulated login response
const loginResponse: LoginResponse = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  user: userInfo,
  expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
};

console.log('\nLogin response:', {
  token: loginResponse.token.substring(0, 20) + '...',
  user: loginResponse.user,
  expiresAt: loginResponse.expiresAt
});

// Example 5: Role-based permission checks
console.log('\n=== Role-based Permissions ===\n');

function canEditPages(user: User): boolean {
  return user.role === UserRole.Editor || 
         user.role === UserRole.TenantAdmin || 
         user.role === UserRole.SuperAdmin;
}

function canManageUsers(user: User): boolean {
  return user.role === UserRole.TenantAdmin || 
         user.role === UserRole.SuperAdmin;
}

function canManageTenants(user: User): boolean {
  return user.role === UserRole.SuperAdmin;
}

const permissions = {
  canEdit: canEditPages(user),
  canManageUsers: canManageUsers(user),
  canManageTenants: canManageTenants(user)
};

console.log(`User "${user.username}" (${user.role}) permissions:`, permissions);

// Example 6: Different user roles
console.log('\n=== Users with Different Roles ===\n');

const viewer: User = { ...user, role: UserRole.Viewer };
const editor: User = { ...user, role: UserRole.Editor };
const admin: User = { ...user, role: UserRole.TenantAdmin };
const superAdmin: User = { ...user, role: UserRole.SuperAdmin };

[viewer, editor, admin, superAdmin].forEach(u => {
  console.log(`\n${u.role}:`);
  console.log(`  Can edit pages: ${canEditPages(u)}`);
  console.log(`  Can manage users: ${canManageUsers(u)}`);
  console.log(`  Can manage tenants: ${canManageTenants(u)}`);
});
