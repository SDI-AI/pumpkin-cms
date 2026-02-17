"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantToTenantInfo = tenantToTenantInfo;
/**
 * Convert full Tenant to simplified TenantInfo
 */
function tenantToTenantInfo(tenant) {
    return {
        id: tenant.id,
        tenantId: tenant.tenantId,
        name: tenant.name,
        status: tenant.status,
    };
}
//# sourceMappingURL=Tenant.js.map