import { Page } from './models/Page';
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
export declare class PageJsonConverter {
    private static defaultOptions;
    /**
     * Normalizes a page slug to lowercase with hyphenation
     * - Converts to lowercase
     * - Replaces spaces, slashes, and backslashes with hyphens
     * - Removes consecutive hyphens
     * - Removes leading/trailing hyphens
     */
    static normalizeSlug(slug: string): string;
    /**
     * Validates if a slug is properly hyphenated
     * - Must be lowercase
     * - Must not contain spaces, slashes, or backslashes
     * - Must not have consecutive hyphens
     * - Must not start or end with hyphen
     */
    static isValidSlug(slug: string): boolean;
    /**
     * Converts a JSON string to a Page object
     */
    static fromJson(json: string, options?: JsonConverterOptions): Page | null;
    /**
     * Converts a Page object to JSON string
     */
    static toJson(page: Page, options?: JsonConverterOptions): string;
    /**
     * Validates if a JSON string represents a valid Page object
     */
    static isValidPageJson(json: string): boolean;
    /**
     * Loads a Page from a JSON file (Node.js environment)
     */
    static fromJsonFile(filePath: string, options?: JsonConverterOptions): Promise<Page | null>;
    /**
     * Saves a Page to a JSON file (Node.js environment)
     */
    static toJsonFile(page: Page, filePath: string, options?: JsonConverterOptions): Promise<boolean>;
    /**
     * Validates if an object has the basic structure of a Page
     */
    private static isValidPageObject;
    /**
     * Processes an HTML block, ensuring it has the correct structure and type
     */
    private static processHtmlBlock;
    /**
     * Validates that a block's content structure matches its type
     */
    private static validateBlockContent;
}
//# sourceMappingURL=PageJsonConverter.d.ts.map