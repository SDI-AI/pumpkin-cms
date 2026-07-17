/**
 * Base interface for all HTML blocks in Pumpkin CMS
 */
export interface IHtmlBlock {
  id?: string;
  name?: string;
  enabled?: boolean;
  schemaVersion?: number;
  type: string;
  content: Record<string, any>;
}

/**
 * Generic HTML block for unknown or custom block types
 */
export interface GenericHtmlBlock extends IHtmlBlock {
  type: string;
  content: Record<string, any>;
}
