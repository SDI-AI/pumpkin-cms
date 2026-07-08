/**
 * Metadata for a tenant media file stored in external asset storage.
 * Blob Storage owns the bytes; this document owns search, ownership, and edit metadata.
 */
export interface MediaAsset {
  id: string;
  mediaAssetId: string;
  tenantId: string;
  fileName: string;
  originalFileName: string;
  blobPath: string;
  publicUrl: string;
  contentType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  altText: string;
  caption: string;
  folder: string;
  tags: string[];
  source: string;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}
