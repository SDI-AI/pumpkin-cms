import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface IconProps {
  /** 
   * Icon name from Lucide React (PascalCase) or emoji string.
   * Examples: "Github", "Mail", "CheckCircle", "🎃"
   * See: https://lucide.dev/icons/
   */
  name: string;
  /** Optional className for custom styling */
  className?: string;
  /** Icon size in pixels (default: 20) */
  size?: number;
  /** Stroke width (default: 2) */
  strokeWidth?: number;
}

/**
 * Icon component that dynamically renders Lucide React icons by name.
 * 
 * Features:
 * - Supports all Lucide React icons via dynamic lookup
 * - Emoji passthrough (if name contains emoji, renders as text)
 * - Fallback warning for missing icons
 * - Tree-shakeable with proper bundling
 * 
 * @example
 * ```tsx
 * <Icon name="Github" size={24} />
 * <Icon name="CheckCircle" className="text-green-600" />
 * <Icon name="🎃" /> // Renders emoji directly
 * ```
 */
export function Icon({ name, className = '', size = 20, strokeWidth = 2 }: IconProps) {
  // Handle empty or undefined names
  if (!name) {
    console.warn('[Icon] No icon name provided');
    return null;
  }

  // Check if it's an emoji or special character (passthrough)
  const emojiRegex = /[\p{Emoji}\p{Emoji_Presentation}]/u;
  if (emojiRegex.test(name)) {
    return (
      <span 
        className={className} 
        style={{ fontSize: size, lineHeight: 1 }}
        aria-label={`Emoji: ${name}`}
      >
        {name}
      </span>
    );
  }

  // Dynamic icon lookup from Lucide React
  // @ts-ignore - Dynamic access to icon components
  const IconComponent = LucideIcons[name];

  if (!IconComponent) {
    console.warn(`[Icon] Icon "${name}" not found in lucide-react. Check spelling or visit https://lucide.dev/icons/`);
    // Fallback: render the name as text for debugging
    return (
      <span 
        className={`${className} text-xs opacity-50`}
        title={`Icon not found: ${name}`}
      >
        [{name}]
      </span>
    );
  }

  return (
    <IconComponent 
      className={className} 
      size={size} 
      strokeWidth={strokeWidth}
      aria-label={name}
    />
  );
}

export default Icon;
