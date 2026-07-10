export type ImageAspect = 'auto' | 'square' | '4:3' | '16:9' | '21:9';
export type ImageFit = 'cover' | 'contain';
export type ImagePosition = 'center' | 'top' | 'bottom' | 'left' | 'right';
export interface ImagePresentation {
    imageAspect?: ImageAspect;
    imageFit?: ImageFit;
    imagePosition?: ImagePosition;
}
//# sourceMappingURL=ImagePresentation.d.ts.map