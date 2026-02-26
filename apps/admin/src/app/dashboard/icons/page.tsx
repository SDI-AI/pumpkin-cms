'use client';

import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { icons } from 'lucide-react';

export default function IconsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const [iconSize, setIconSize] = useState(24);

  // Get all icon names from lucide-react (client-side)
  const allIconNames = useMemo(() => {
    // Use the icons object from lucide-react which contains all icon definitions
    if (icons) {
      return Object.keys(icons).sort();
    }
    
    // Fallback to filtering exports
    return Object.keys(LucideIcons)
      .filter(
        (key) => 
          key !== 'default' && 
          key !== 'createLucideIcon' &&
          key !== 'icons' &&
          typeof LucideIcons[key as keyof typeof LucideIcons] === 'function'
      )
      .sort();
  }, []);

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return allIconNames;
    const query = searchQuery.toLowerCase();
    return allIconNames.filter((name) =>
      name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleCopyIconName = (iconName: string) => {
    navigator.clipboard.writeText(iconName);
    setCopiedIcon(iconName);
    setTimeout(() => setCopiedIcon(null), 2000);
  };

  return (
    <div className="py-6 px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
          Lucide React Icons
        </h1>
        <p className="text-neutral-600 mb-4">
          Browse and copy icon names for use in Pumpkin CMS content blocks. 
          {' '}<span className="font-semibold text-neutral-800">{allIconNames.length}</span> icons available.
        </p>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search icons... (e.g., 'github', 'mail', 'check')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Size Slider */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-neutral-700 whitespace-nowrap">
                Size: {iconSize}px
              </label>
              <input
                type="range"
                min="16"
                max="48"
                value={iconSize}
                onChange={(e) => setIconSize(Number(e.target.value))}
                className="w-32"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-neutral-500">
            {filteredIcons.length === allIconNames.length ? (
              `Showing all ${allIconNames.length} icons`
            ) : (
              `Found ${filteredIcons.length} icon${filteredIcons.length !== 1 ? 's' : ''}`
            )}
          </div>
        </div>

      {/* Icon Grid */}
      <div className="mb-8">
        {filteredIcons.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">No icons found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filteredIcons.map((iconName) => {
              // @ts-ignore - Dynamic icon access
              const IconComponent = LucideIcons[iconName];
              const isCopied = copiedIcon === iconName;

              return (
                <button
                  key={iconName}
                  onClick={() => handleCopyIconName(iconName)}
                  className={`
                    group relative flex flex-col items-center justify-center p-4 rounded-lg border-2 
                    transition-all duration-200 hover:shadow-lg
                    ${
                      isCopied
                        ? 'border-green-500 bg-green-50'
                        : 'border-neutral-200 bg-white hover:border-primary-400 hover:bg-primary-50'
                    }
                  `}
                  title={`Click to copy: ${iconName}`}
                >
                  {/* Icon */}
                  <div className="mb-2">
                    <IconComponent 
                      size={iconSize} 
                      className={isCopied ? 'text-green-600' : 'text-neutral-700 group-hover:text-primary-600'}
                      strokeWidth={2}
                    />
                  </div>

                  {/* Icon Name */}
                  <span className={`
                    text-xs text-center font-medium break-words w-full px-1
                    ${isCopied ? 'text-green-700' : 'text-neutral-600 group-hover:text-primary-700'}
                  `}>
                    {iconName}
                  </span>

                  {/* Copied Indicator */}
                  {isCopied && (
                    <span className="absolute top-1 right-1 text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-neutral-200 pt-6">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-3">How to Use Icons in Pumpkin CMS</h2>
          <div className="space-y-3 text-sm text-neutral-700">
            <p>
              <strong>1. Click to copy</strong> any icon name above (PascalCase format).
            </p>
            <p>
              <strong>2. Use in JSON content blocks:</strong>
            </p>
            <pre className="bg-neutral-900 text-green-400 p-4 rounded-md overflow-x-auto text-xs">
{`{
  "blockType": "CardGrid",
  "content": {
    "cards": [
      {
        "icon": "Github",
        "title": "Open Source",
        "description": "Built in public on GitHub"
      }
    ]
  }
}`}
            </pre>
            <p>
              <strong>3. Icons render automatically</strong> in CardGrid, TrustBar, LocalProTips, and Contact blocks.
            </p>
            <p className="text-xs text-neutral-500 mt-4">
              Icons provided by{' '}
              <a 
                href="https://lucide.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-primary-600"
              >
                Lucide React
              </a>
              {' '}• MIT License
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
