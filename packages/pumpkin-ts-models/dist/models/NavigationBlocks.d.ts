import { IHtmlBlock } from './IHtmlBlock';
export interface BreadcrumbItem {
    label: string;
    url: string;
    current: boolean;
}
export interface BreadcrumbsContent {
    items: BreadcrumbItem[];
}
export interface BreadcrumbsBlock extends IHtmlBlock {
    type: 'Breadcrumbs';
    content: BreadcrumbsContent;
}
export interface TrustBarItem {
    icon: string;
    title: string;
    text: string;
    alt: string;
}
export interface TrustBarContent {
    items: TrustBarItem[];
}
export interface TrustBarBlock extends IHtmlBlock {
    type: 'TrustBar';
    content: TrustBarContent;
}
export interface Step {
    title: string;
    text: string;
    image: string;
    alt: string;
}
export interface HowItWorksContent {
    title: string;
    steps: Step[];
}
export interface HowItWorksBlock extends IHtmlBlock {
    type: 'HowItWorks';
    content: HowItWorksContent;
}
export interface ServiceAreaMapContent {
    title: string;
    subtitle: string;
    mapEmbedUrl: string;
    neighborhoods: string[];
    zipCodes: string[];
    nearbyCities: string[];
}
export interface ServiceAreaMapBlock extends IHtmlBlock {
    type: 'ServiceAreaMap';
    content: ServiceAreaMapContent;
}
export interface ProTipItem {
    icon: string;
    image: string;
    title: string;
    text: string;
}
export interface LocalProTipsContent {
    title: string;
    items: ProTipItem[];
}
export interface LocalProTipsBlock extends IHtmlBlock {
    type: 'LocalProTips';
    content: LocalProTipsContent;
}
//# sourceMappingURL=NavigationBlocks.d.ts.map