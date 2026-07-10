import type { ImageAspect, ImageFit, ImagePosition } from 'pumpkin-ts-models';

const aspectClasses: Record<ImageAspect, string> = {
  auto: '',
  square: 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '16:9': 'aspect-video',
  '21:9': 'aspect-[21/9]',
};

const fitClasses: Record<ImageFit, string> = {
  cover: 'object-cover',
  contain: 'object-contain',
};

const positionClasses: Record<ImagePosition, string> = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
};

const backgroundPositions: Record<ImagePosition, string> = {
  center: 'center',
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
};

export function imagePresentationClasses({
  aspect = 'auto',
  fit = 'cover',
  position = 'center',
}: {
  aspect?: ImageAspect;
  fit?: ImageFit;
  position?: ImagePosition;
}) {
  return [aspectClasses[aspect], fitClasses[fit], positionClasses[position]].filter(Boolean).join(' ');
}

export function backgroundPosition(position: ImagePosition = 'center') {
  return backgroundPositions[position] ?? backgroundPositions.center;
}
