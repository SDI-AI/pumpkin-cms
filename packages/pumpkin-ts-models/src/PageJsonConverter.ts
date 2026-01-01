import { Page } from './models/Page';
import { IHtmlBlock } from './models/IHtmlBlock';
import { HtmlBlock, isHtmlBlock, createGenericBlock } from './models/HtmlBlockTypes';

/**
 * Options for JSON conversion
 */
export interface JsonConverterOptions {
  /** Whether to format the output JSON with indentation */
  prettify?: boolean;
  /** Custom replacer function for JSON.stringify */
  replacer?: (key: string, value: any) => any;
  /** Custom reviver function for JSON.parse */
  reviver?: (key: string, value: any) => any;
}

/**
 * Utility class for converting between JSON and Page objects
 */
export class PageJsonConverter {
  private static defaultOptions: JsonConverterOptions = {
    prettify: true
  };

  /**
   * Normalizes a page slug to lowercase
   */
  static normalizeSlug(slug: string): string {
    return slug?.toLowerCase() ?? '';
  }

  /**
   * Converts a JSON string to a Page object
   */
  static fromJson(json: string, options: JsonConverterOptions = {}): Page | null {
    if (!json || json.trim() === '') {
      return null;
    }

    try {
      const opts = { ...this.defaultOptions, ...options };
      const parsed = JSON.parse(json, opts.reviver);
      
      // Validate basic page structure
      if (!this.isValidPageObject(parsed)) {
        return null;
      }

      // Ensure pageSlug is always lowercase
      if (parsed.pageSlug) {
        parsed.pageSlug = parsed.pageSlug.toLowerCase();
      }

      // Process HTML blocks
      if (parsed.ContentData?.ContentBlocks) {
        parsed.ContentData.ContentBlocks = parsed.ContentData.ContentBlocks.map(
          (block: any) => this.processHtmlBlock(block)
        );
      }

      return parsed as Page;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return null;
    }
  }

  /**
   * Converts a Page object to JSON string
   */
  static toJson(page: Page, options: JsonConverterOptions = {}): string {
    if (!page) {
      return '';
    }

    try {
      const opts = { ...this.defaultOptions, ...options };
      const space = opts.prettify ? 2 : undefined;
      return JSON.stringify(page, opts.replacer, space);
    } catch (error) {
      console.error('Failed to stringify page:', error);
      return '';
    }
  }

  /**
   * Validates if a JSON string represents a valid Page object
   */
  static isValidPageJson(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      return this.isValidPageObject(parsed);
    } catch {
      return false;
    }
  }

  /**
   * Loads a Page from a JSON file (Node.js environment)
   */
  static async fromJsonFile(filePath: string, options: JsonConverterOptions = {}): Promise<Page | null> {
    try {
      // This would work in Node.js environment
      if (typeof require !== 'undefined') {
        const fs = require('fs').promises;
        const json = await fs.readFile(filePath, 'utf8');
        return this.fromJson(json, options);
      }
      
      // Browser environment - would need fetch or file input
      console.warn('File system access not available in browser environment');
      return null;
    } catch (error) {
      console.error('Failed to read file:', error);
      return null;
    }
  }

  /**
   * Saves a Page to a JSON file (Node.js environment)
   */
  static async toJsonFile(page: Page, filePath: string, options: JsonConverterOptions = {}): Promise<boolean> {
    try {
      // This would work in Node.js environment
      if (typeof require !== 'undefined') {
        const fs = require('fs').promises;
        const path = require('path');
        
        const json = this.toJson(page, options);
        if (!json) return false;

        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        await fs.writeFile(filePath, json, 'utf8');
        return true;
      }
      
      console.warn('File system access not available in browser environment');
      return false;
    } catch (error) {
      console.error('Failed to write file:', error);
      return false;
    }
  }

  /**
   * Validates if an object has the basic structure of a Page
   */
  private static isValidPageObject(obj: any): boolean {
    return obj &&
           typeof obj.PageId === 'string' &&
           typeof obj.pageSlug === 'string' &&
           typeof obj.PageVersion === 'number' &&
           obj.MetaData &&
           obj.ContentData &&
           Array.isArray(obj.ContentData.ContentBlocks);
  }

  /**
   * Processes an HTML block, ensuring it has the correct structure and type
   */
  private static processHtmlBlock(block: any): IHtmlBlock {
    if (!isHtmlBlock(block)) {
      console.warn('Invalid block structure:', block);
      return createGenericBlock('Unknown', {});
    }

    // Type discrimination based on block type
    switch (block.type) {
      case 'Hero':
      case 'PrimaryCTA':
      case 'SecondaryCTA':
      case 'CardGrid':
      case 'FAQ':
      case 'Breadcrumbs':
      case 'TrustBar':
      case 'HowItWorks':
      case 'ServiceAreaMap':
      case 'LocalProTips':
      case 'Gallery':
      case 'Testimonials':
      case 'Contact':
      case 'Blog':
        // For known types, validate and return the block with proper structure
        return this.validateBlockContent(block);
      
      default:
        // For unknown types, create a generic block
        console.warn(`Unknown block type: ${block.type}`);
        return createGenericBlock(block.type, block.content);
    }
  }

  /**
   * Validates that a block's content structure matches its type
   */
  private static validateBlockContent(block: any): IHtmlBlock {
    // Ensure content is an object
    if (!block.content || typeof block.content !== 'object') {
      console.warn(`Invalid content for block type ${block.type}:`, block.content);
      return createGenericBlock(block.type, {});
    }

    // Return the block - TypeScript will use discriminated unions for type safety
    return {
      type: block.type,
      content: block.content
    } as IHtmlBlock;
  }
}