import type { IHtmlBlock } from './IHtmlBlock';
import type { ImageAspect, ImageFit, ImagePosition } from './ImagePresentation';
export interface GalleryImage {
    src: string;
    alt: string;
    caption: string;
}
export interface GalleryContent {
    title: string;
    subtitle: string;
    imageAspect?: ImageAspect;
    imageFit?: ImageFit;
    imagePosition?: ImagePosition;
    images: GalleryImage[];
}
export interface GalleryBlock extends IHtmlBlock {
    type: "Gallery";
    content: GalleryContent;
}
export interface TestimonialItem {
    quote: string;
    author: string;
    eventType: string;
    rating: number;
}
export interface TestimonialsContent {
    title: string;
    subtitle: string;
    layout: string;
    items: TestimonialItem[];
}
export interface TestimonialsBlock extends IHtmlBlock {
    type: "Testimonials";
    content: TestimonialsContent;
}
export type SocialEmbedPlatform = "Instagram" | "YouTube" | "TikTok" | "Facebook" | "X" | "Pinterest" | "LinkedIn";
export type SocialEmbedLayout = "grid" | "stack" | "carousel";
export interface SocialEmbedItem {
    platform: SocialEmbedPlatform;
    url: string;
    caption: string;
}
export interface SocialEmbedContent {
    title: string;
    subtitle: string;
    layout: SocialEmbedLayout;
    aspect: ImageAspect;
    items: SocialEmbedItem[];
}
export interface SocialEmbedBlock extends IHtmlBlock {
    type: "SocialEmbed";
    content: SocialEmbedContent;
}
export type SocialLinksLayout = "inline" | "grid" | "stack";
export type SocialLinksPlatform = "Instagram" | "Facebook" | "TikTok" | "YouTube" | "X" | "Pinterest" | "LinkedIn" | "Yelp" | "GoogleBusiness" | "Other";
export interface SocialProfileLink {
    platform: SocialLinksPlatform;
    url: string;
    label: string;
    icon: string;
}
export interface SocialLinksContent {
    title: string;
    subtitle: string;
    layout: SocialLinksLayout;
    links: SocialProfileLink[];
}
export interface SocialLinksBlock extends IHtmlBlock {
    type: "SocialLinks";
    content: SocialLinksContent;
}
export interface FormField {
    label: string;
    type: string;
    required: boolean;
    placeholder: string;
}
export interface SocialLink {
    platform: string;
    url: string;
    icon: string;
}
export interface ContactContent {
    id: string;
    title: string;
    subtitle: string;
    address: string;
    phone: string;
    email: string;
    hours: string;
    formFields: FormField[];
    submitButtonText: string;
    socialLinks: SocialLink[];
}
export interface ContactBlock extends IHtmlBlock {
    type: "Contact";
    content: ContactContent;
}
export interface FormBlockContent {
    formType: string;
    title: string;
    subtitle: string;
    description?: string;
    layout: string;
    successMessage: string;
}
export interface FormBlock extends IHtmlBlock {
    type: "Form";
    content: FormBlockContent;
}
//# sourceMappingURL=InteractionBlocks.d.ts.map