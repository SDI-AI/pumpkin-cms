import { IHtmlBlock } from './IHtmlBlock';

// Gallery Block
export interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

export interface GalleryContent {
  title: string;
  subtitle: string;
  images: GalleryImage[];
}

export interface GalleryBlock extends IHtmlBlock {
  type: 'Gallery';
  content: GalleryContent;
}

// Testimonials Block
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
  type: 'Testimonials';
  content: TestimonialsContent;
}

// Contact Block
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
  type: 'Contact';
  content: ContactContent;
}