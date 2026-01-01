"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageJsonConverter = void 0;
const HtmlBlockTypes_1 = require("./models/HtmlBlockTypes");
/**
 * Utility class for converting between JSON and Page objects
 */
class PageJsonConverter {
    /**
     * Normalizes a page slug to lowercase
     */
    static normalizeSlug(slug) {
        return slug?.toLowerCase() ?? '';
    }
    /**
     * Converts a JSON string to a Page object
     */
    static fromJson(json, options = {}) {
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
                parsed.ContentData.ContentBlocks = parsed.ContentData.ContentBlocks.map((block) => this.processHtmlBlock(block));
            }
            return parsed;
        }
        catch (error) {
            console.error('Failed to parse JSON:', error);
            return null;
        }
    }
    /**
     * Converts a Page object to JSON string
     */
    static toJson(page, options = {}) {
        if (!page) {
            return '';
        }
        try {
            const opts = { ...this.defaultOptions, ...options };
            const space = opts.prettify ? 2 : undefined;
            return JSON.stringify(page, opts.replacer, space);
        }
        catch (error) {
            console.error('Failed to stringify page:', error);
            return '';
        }
    }
    /**
     * Validates if a JSON string represents a valid Page object
     */
    static isValidPageJson(json) {
        try {
            const parsed = JSON.parse(json);
            return this.isValidPageObject(parsed);
        }
        catch {
            return false;
        }
    }
    /**
     * Loads a Page from a JSON file (Node.js environment)
     */
    static async fromJsonFile(filePath, options = {}) {
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
        }
        catch (error) {
            console.error('Failed to read file:', error);
            return null;
        }
    }
    /**
     * Saves a Page to a JSON file (Node.js environment)
     */
    static async toJsonFile(page, filePath, options = {}) {
        try {
            // This would work in Node.js environment
            if (typeof require !== 'undefined') {
                const fs = require('fs').promises;
                const path = require('path');
                const json = this.toJson(page, options);
                if (!json)
                    return false;
                // Ensure directory exists
                const dir = path.dirname(filePath);
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(filePath, json, 'utf8');
                return true;
            }
            console.warn('File system access not available in browser environment');
            return false;
        }
        catch (error) {
            console.error('Failed to write file:', error);
            return false;
        }
    }
    /**
     * Validates if an object has the basic structure of a Page
     */
    static isValidPageObject(obj) {
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
    static processHtmlBlock(block) {
        if (!(0, HtmlBlockTypes_1.isHtmlBlock)(block)) {
            console.warn('Invalid block structure:', block);
            return (0, HtmlBlockTypes_1.createGenericBlock)('Unknown', {});
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
                return (0, HtmlBlockTypes_1.createGenericBlock)(block.type, block.content);
        }
    }
    /**
     * Validates that a block's content structure matches its type
     */
    static validateBlockContent(block) {
        // Ensure content is an object
        if (!block.content || typeof block.content !== 'object') {
            console.warn(`Invalid content for block type ${block.type}:`, block.content);
            return (0, HtmlBlockTypes_1.createGenericBlock)(block.type, {});
        }
        // Return the block - TypeScript will use discriminated unions for type safety
        return {
            type: block.type,
            content: block.content
        };
    }
}
exports.PageJsonConverter = PageJsonConverter;
PageJsonConverter.defaultOptions = {
    prettify: true
};
//# sourceMappingURL=PageJsonConverter.js.map