/**
 * V2 Designer-specific types for Pumpkin CMS
 * These types support the visual page builder, asset management, and configuration UI
 */
/**
 * Block template definition for the designer toolbox
 */
export interface BlockTemplate {
    type: string;
    label: string;
    icon: string;
    category: 'Navigation' | 'Hero' | 'Content' | 'CTA' | 'Interaction';
    defaultProps: Record<string, any>;
    description?: string;
}
/**
 * Style preset for the designer settings panel
 */
export interface StylePreset {
    category: string;
    presets: {
        label: string;
        value: string;
    }[];
}
/**
 * Asset metadata stored in Cosmos DB
 * Actual file stored in local filesystem or Azure Blob Storage
 */
export interface Asset {
    id: string;
    tenantId: string;
    fileName: string;
    fileUrl: string;
    fileType: 'image' | 'video' | 'document';
    mimeType: string;
    sizeBytes: number;
    dimensions?: {
        width: number;
        height: number;
    };
    uploadedBy: string;
    uploadedAt: string;
    tags: string[];
    altText?: string;
    cdnUrl?: string;
}
/**
 * Page version history snapshot
 * Allows rollback to previous versions
 */
export interface PageHistory {
    id: string;
    tenantId: string;
    pageId: string;
    pageSlug: string;
    version: number;
    snapshot: any;
    changedBy: string;
    changedAt: string;
    changeType: 'create' | 'update' | 'publish';
}
/**
 * Application-wide settings configurable via UI
 * Stored per tenant
 */
export interface AppSettings {
    id: string;
    tenantId: string;
    apiUrl: string;
    apiKey: string;
    storageProvider: 'LocalFileSystem' | 'AzureBlob';
    storageCdnUrl?: string;
    maintenanceMode: boolean;
    features: {
        enableImageOptimization: boolean;
        enableVersionHistory: boolean;
        maxUploadSizeMB: number;
    };
    updatedAt: string;
    updatedBy: string;
}
/**
 * Craft.js serialized node tree
 * Used for visual designer state persistence
 */
export interface CraftNodeData {
    [nodeId: string]: {
        type: {
            resolvedName: string;
        };
        props: Record<string, any>;
        displayName: string;
        custom: Record<string, any>;
        parent: string | null;
        isCanvas: boolean;
        nodes: string[];
        linkedNodes: Record<string, string>;
    };
}
/**
 * Designer configuration passed from server to client
 */
export interface DesignerConfig {
    tenantId: string;
    apiUrl: string;
    apiKey: string;
    jwtToken?: string;
    user?: {
        email: string;
        role: string;
        userId: string;
    };
}
//# sourceMappingURL=Designer.d.ts.map