'use client'

import { useState, useEffect } from 'react'

interface StructuredDataEditorProps {
  value: string
  onChange: (value: string) => void
}

interface SchemaTemplate {
  name: string
  type: string
  template: object
  description: string
}

const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    name: 'Article',
    type: 'Article',
    description: 'Blog posts, news articles, and editorial content',
    template: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '',
      description: '',
      image: '',
      author: {
        '@type': 'Person',
        name: '',
      },
      publisher: {
        '@type': 'Organization',
        name: '',
        logo: {
          '@type': 'ImageObject',
          url: '',
        },
      },
      datePublished: '',
      dateModified: '',
    },
  },
  {
    name: 'Local Business',
    type: 'LocalBusiness',
    description: 'Physical business locations with address and hours',
    template: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: '',
      description: '',
      image: '',
      '@id': '',
      url: '',
      telephone: '',
      priceRange: '',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '',
        addressLocality: '',
        addressRegion: '',
        postalCode: '',
        addressCountry: '',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 0,
        longitude: 0,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '17:00',
        },
      ],
    },
  },
  {
    name: 'Organization',
    type: 'Organization',
    description: 'Company or organization information',
    template: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '',
      alternateName: '',
      url: '',
      logo: '',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '',
        contactType: 'customer service',
        areaServed: '',
        availableLanguage: 'en',
      },
      sameAs: ['', '', ''],
    },
  },
  {
    name: 'FAQ Page',
    type: 'FAQPage',
    description: 'Frequently asked questions with answers',
    template: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '',
          },
        },
      ],
    },
  },
  {
    name: 'Product',
    type: 'Product',
    description: 'E-commerce products with pricing and ratings',
    template: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: '',
      image: '',
      description: '',
      brand: {
        '@type': 'Brand',
        name: '',
      },
      offers: {
        '@type': 'Offer',
        url: '',
        priceCurrency: 'USD',
        price: '',
        priceValidUntil: '',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '',
        reviewCount: '',
      },
    },
  },
  {
    name: 'Breadcrumb List',
    type: 'BreadcrumbList',
    description: 'Navigation breadcrumbs for site hierarchy',
    template: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '',
          item: '',
        },
      ],
    },
  },
  {
    name: 'Web Page',
    type: 'WebPage',
    description: 'General web page with breadcrumbs',
    template: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: '',
      description: '',
      url: '',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '',
            item: '',
          },
        ],
      },
    },
  },
  {
    name: 'Blog Posting',
    type: 'BlogPosting',
    description: 'Blog-specific article markup',
    template: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: '',
      description: '',
      image: '',
      author: {
        '@type': 'Person',
        name: '',
      },
      publisher: {
        '@type': 'Organization',
        name: '',
        logo: {
          '@type': 'ImageObject',
          url: '',
        },
      },
      datePublished: '',
      dateModified: '',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': '',
      },
    },
  },
  {
    name: 'Service',
    type: 'Service',
    description: 'Service offerings and providers',
    template: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: '',
      provider: {
        '@type': 'Organization',
        name: '',
      },
      areaServed: {
        '@type': 'City',
        name: '',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: '',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: '',
            },
          },
        ],
      },
    },
  },
  {
    name: 'How-To',
    type: 'HowTo',
    description: 'Step-by-step instructions and guides',
    template: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: '',
      description: '',
      image: '',
      totalTime: 'PT30M',
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: '',
      },
      tool: [
        {
          '@type': 'HowToTool',
          name: '',
        },
      ],
      step: [
        {
          '@type': 'HowToStep',
          name: '',
          text: '',
          image: '',
          url: '',
        },
      ],
    },
  },
]

// Helper to render field based on type
function renderField(
  key: string,
  value: any,
  path: string,
  onChange: (path: string, newValue: any) => void
): JSX.Element {
  const fieldId = `field-${path.replace(/\./g, '-')}`
  
  if (typeof value === 'string') {
    return (
      <div key={path} className="mb-3">
        <label htmlFor={fieldId} className="block text-xs font-medium text-neutral-700 mb-1">
          {key}
        </label>
        <input
          id={fieldId}
          type="text"
          value={value}
          onChange={(e) => onChange(path, e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={`Enter ${key}`}
        />
      </div>
    )
  }
  
  if (typeof value === 'number') {
    return (
      <div key={path} className="mb-3">
        <label htmlFor={fieldId} className="block text-xs font-medium text-neutral-700 mb-1">
          {key}
        </label>
        <input
          id={fieldId}
          type="number"
          value={value}
          onChange={(e) => onChange(path, parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    )
  }
  
  return <div key={path}></div>
}

// Tree node component
function TreeNode({ 
  label, 
  path, 
  isExpanded, 
  onToggle, 
  hasChildren,
  isSelected,
  onSelect
}: { 
  label: string
  path: string
  isExpanded: boolean
  onToggle: () => void
  hasChildren: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div 
      className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-neutral-100 ${
        isSelected ? 'bg-primary-100 text-primary-900' : 'text-neutral-700'
      }`}
      onClick={onSelect}
    >
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className="text-neutral-500 hover:text-neutral-700"
        >
          <svg className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <span className="w-3"></span>
      )}
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

export function StructuredDataEditor({ value, onChange }: StructuredDataEditorProps) {
  const [schemaData, setSchemaData] = useState<any>({})
  const [selectedTemplate, setSelectedTemplate] = useState<SchemaTemplate | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(true)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']))
  const [selectedPath, setSelectedPath] = useState<string>('root')

  // Initialize from value
  useEffect(() => {
    if (value && value.trim()) {
      try {
        const parsed = JSON.parse(value)
        setSchemaData(parsed)
        setShowTemplateSelector(false)
        // Try to detect which template this is
        const matchingTemplate = SCHEMA_TEMPLATES.find(t => t.type === parsed['@type'])
        if (matchingTemplate) {
          setSelectedTemplate(matchingTemplate)
        }
      } catch (e) {
        // If invalid JSON, show template selector
        setShowTemplateSelector(true)
      }
    } else {
      setShowTemplateSelector(true)
    }
  }, [value])

  // Update parent when schemaData changes
  useEffect(() => {
    if (Object.keys(schemaData).length > 0) {
      onChange(JSON.stringify(schemaData, null, 2))
    }
  }, [schemaData, onChange])

  const selectTemplate = (template: SchemaTemplate) => {
    setSelectedTemplate(template)
    setSchemaData(JSON.parse(JSON.stringify(template.template)))
    setShowTemplateSelector(false)
    setExpandedPaths(new Set(['root']))
    setSelectedPath('root')
  }

  const changeTemplate = () => {
    if (confirm('Are you sure? This will replace all current data with a new template.')) {
      setShowTemplateSelector(true)
      setSchemaData({})
      setSelectedTemplate(null)
      setSelectedPath('root')
      setExpandedPaths(new Set(['root']))
    }
  }

  const updateValue = (path: string, newValue: any) => {
    const pathParts = path.split('.')
    const newData = JSON.parse(JSON.stringify(schemaData))
    
    try {
      let current = newData
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current && typeof current === 'object' && pathParts[i] in current) {
          current = current[pathParts[i]]
        } else {
          console.error(`Path ${path} not found in schema`)
          return
        }
      }
      current[pathParts[pathParts.length - 1]] = newValue
      setSchemaData(newData)
    } catch (error) {
      console.error('Error updating value:', error)
      setSelectedPath('root')
    }
  }

  const togglePath = (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const renderTree = (obj: any, currentPath: string = 'root', level: number = 0): JSX.Element[] => {
    const elements: JSX.Element[] = []
    
    if (level === 0) {
      elements.push(
        <TreeNode
          key="root"
          label={selectedTemplate?.name || '@type'}
          path="root"
          isExpanded={expandedPaths.has('root')}
          onToggle={() => togglePath('root')}
          hasChildren={true}
          isSelected={selectedPath === 'root'}
          onSelect={() => setSelectedPath('root')}
        />
      )
      
      if (!expandedPaths.has('root')) {
        return elements
      }
    }
    
    Object.entries(obj).forEach(([key, val]) => {
      if (key === '@context') return // Skip context in tree
      
      const path = currentPath === 'root' ? key : `${currentPath}.${key}`
      const hasChildren = typeof val === 'object' && val !== null && !Array.isArray(val)
      
      elements.push(
        <div key={path} style={{ marginLeft: `${level * 12}px` }}>
          <TreeNode
            label={key}
            path={path}
            isExpanded={expandedPaths.has(path)}
            onToggle={() => togglePath(path)}
            hasChildren={hasChildren}
            isSelected={selectedPath === path}
            onSelect={() => setSelectedPath(path)}
          />
        </div>
      )
      
      if (hasChildren && expandedPaths.has(path)) {
        elements.push(...renderTree(val, path, level + 1))
      }
    })
    
    return elements
  }

  const renderFormFields = () => {
    if (selectedPath === 'root') {
      return (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-900">🎯 {selectedTemplate?.name}</p>
            <p className="text-xs text-blue-700 mt-1">{selectedTemplate?.description}</p>
            <p className="text-xs text-blue-600 mt-2">Select a field from the tree to edit its value</p>
          </div>
        </div>
      )
    }
    
    // Get value at selected path
    const pathParts = selectedPath.split('.')
    let current: any = schemaData
    
    try {
      for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part]
        } else {
          // Path no longer exists, reset to root
          setSelectedPath('root')
          return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">Field not found. Select a field from the tree.</p>
            </div>
          )
        }
      }
    } catch (error) {
      setSelectedPath('root')
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">Field not found. Select a field from the tree.</p>
        </div>
      )
    }
    
    const key = pathParts[pathParts.length - 1]
    
    // Handle objects
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded">
            <p className="text-sm font-medium text-neutral-800">{key}</p>
            <p className="text-xs text-neutral-600 mt-1">
              Expand this node in the tree to edit nested fields
            </p>
          </div>
        </div>
      )
    }
    
    // Handle arrays
    if (Array.isArray(current)) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-neutral-800">{key}</label>
            <span className="text-xs text-neutral-500">{current.length} items</span>
          </div>
          {current.map((item, index) => {
            if (typeof item === 'string') {
              return (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newArray = [...current]
                      newArray[index] = e.target.value
                      updateValue(selectedPath, newArray)
                    }}
                    className="flex-1 px-2 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => {
                      const newArray = current.filter((_: any, i: number) => i !== index)
                      updateValue(selectedPath, newArray)
                    }}
                    className="px-2 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded"
                  >
                    ✕
                  </button>
                </div>
              )
            }
            return (
              <div key={index} className="p-2 bg-neutral-50 border border-neutral-200 rounded text-xs">
                Object item {index + 1} - use tree to edit nested fields
              </div>
            )
          })}
          <button
            onClick={() => {
              const newArray = [...current, '']
              updateValue(selectedPath, newArray)
            }}
            className="w-full px-3 py-2 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded"
          >
            + Add Item
          </button>
        </div>
      )
    }
    
    // Handle primitives
    return (
      <div className="space-y-3">
        {renderField(key, current, selectedPath, updateValue)}
      </div>
    )
  }

  if (showTemplateSelector) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-900 mb-1">
            Select Schema.org Template
          </h3>
          <p className="text-xs text-neutral-500">
            Choose a template to get started with structured data
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {SCHEMA_TEMPLATES.map((template) => (
            <button
              key={template.type}
              type="button"
              onClick={() => selectTemplate(template)}
              className="text-left p-3 bg-white border-2 border-neutral-200 hover:border-primary-400 rounded-lg transition-colors"
            >
              <div className="font-medium text-sm text-neutral-900">{template.name}</div>
              <div className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wide">{template.type}</div>
              <div className="text-xs text-neutral-600 mt-2">{template.description}</div>
            </button>
          ))}
        </div>
        
        <div className="pt-3 border-t border-neutral-200">
          <a
            href="https://schema.org/docs/schemas.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            📖 View all schema.org types →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <div>
          <h3 className="text-sm font-medium text-neutral-900">
            {selectedTemplate?.name} Schema
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Edit fields using the form below
          </p>
        </div>
        <button
          type="button"
          onClick={changeTemplate}
          className="text-xs px-3 py-1.5 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded font-medium"
        >
          Change Template
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-5 gap-4">
        {/* Left: Tree View */}
        <div className="col-span-2 bg-neutral-50 border border-neutral-200 rounded-lg p-3 max-h-[500px] overflow-y-auto">
          <div className="text-xs font-medium text-neutral-600 mb-2">Structure</div>
          <div className="space-y-0.5">
            {renderTree(schemaData)}
          </div>
        </div>

        {/* Right: Form Fields */}
        <div className="col-span-3 border border-neutral-200 rounded-lg p-4 max-h-[500px] overflow-y-auto">
          {renderFormFields()}
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex gap-3 pt-3 border-t border-neutral-200">
        <a
          href="https://schema.org/docs/schemas.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
        >
          📖 Schema.org Docs
        </a>
        <a
          href="https://validator.schema.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-600 hover:text-green-700 hover:underline"
        >
          ✓ Validate Online
        </a>
      </div>
    </div>
  )
}
