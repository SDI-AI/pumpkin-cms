"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_BLOCK_TYPES = exports.BLOCK_TYPE_MAP = void 0;
exports.isBlockOfType = isBlockOfType;
exports.isHtmlBlock = isHtmlBlock;
exports.createGenericBlock = createGenericBlock;
/**
 * Map of block types to their corresponding interfaces
 */
exports.BLOCK_TYPE_MAP = {
    'Hero': 'HeroBlock',
    'PrimaryCTA': 'PrimaryCtaBlock',
    'SecondaryCTA': 'SecondaryCtaBlock',
    'CardGrid': 'CardGridBlock',
    'FAQ': 'FaqBlock',
    'Breadcrumbs': 'BreadcrumbsBlock',
    'TrustBar': 'TrustBarBlock',
    'HowItWorks': 'HowItWorksBlock',
    'ServiceAreaMap': 'ServiceAreaMapBlock',
    'LocalProTips': 'LocalProTipsBlock',
    'Gallery': 'GalleryBlock',
    'Testimonials': 'TestimonialsBlock',
    'Contact': 'ContactBlock'
};
/**
 * Array of all supported block types
 */
exports.SUPPORTED_BLOCK_TYPES = Object.keys(exports.BLOCK_TYPE_MAP);
/**
 * Type guard to check if a block is a specific type
 */
function isBlockOfType(block, type) {
    return block.type === type;
}
/**
 * Type guard to check if an object is a valid HTML block
 */
function isHtmlBlock(obj) {
    return obj && typeof obj.type === 'string' && typeof obj.content === 'object';
}
/**
 * Creates a generic HTML block for unknown types
 */
function createGenericBlock(type, content) {
    return {
        type,
        content
    };
}
//# sourceMappingURL=HtmlBlockTypes.js.map