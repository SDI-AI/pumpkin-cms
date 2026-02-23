'use client'

import { useState, useEffect } from 'react'
import { StructuredDataEditor } from './StructuredDataEditor'

interface StructuredDataModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (value: string) => void
  initialValue?: string
  title?: string
}

export function StructuredDataModal({
  isOpen,
  onClose,
  onSave,
  initialValue = '',
  title = 'Edit Structured Data'
}: StructuredDataModalProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSave = () => {
    // Validate JSON before saving
    try {
      if (value.trim()) {
        JSON.parse(value)
      }
      onSave(value)
      onClose()
    } catch (e) {
      alert('Please fix JSON errors before saving.')
    }
  }

  const handleCancel = () => {
    setValue(initialValue)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
            <button
              onClick={handleCancel}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <StructuredDataEditor
              value={value}
              onChange={setValue}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
