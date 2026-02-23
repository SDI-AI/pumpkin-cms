/**
 * Represents metadata associated with a form submission
 */
export interface FormEntryMetadata {
  source: string;
  referrer: string;
  status: string;
  tags: string[];
}

/**
 * Represents a form submission entry stored in the FormEntry container
 */
export interface FormEntry {
  id: string;
  tenantId: string;
  formId: string;
  pageSlug: string;
  formData: Record<string, any>;
  submittedAt: string; // ISO 8601 date string
  ipAddress: string;
  userAgent: string;
  metadata: FormEntryMetadata;
}
