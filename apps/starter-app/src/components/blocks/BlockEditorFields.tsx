'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp, Image as ImageIcon, X } from 'lucide-react'
import type { IHtmlBlock, MediaAsset } from 'pumpkin-ts-models'
import { MediaPickerDialog } from '@/components/admin/MediaPickerDialog'

interface BlockEditorFieldsProps {
  block: IHtmlBlock
  onChange: (content: Record<string, any>) => void
}

export default function BlockEditorFields({ block, onChange }: BlockEditorFieldsProps) {
  const content = block.content as Record<string, any>

  const update = (key: string, value: any) => {
    onChange({ ...content, [key]: value })
  }

  switch (block.type) {
    case 'Hero':
      return <HeroFields content={content} update={update} onChange={onChange} />
    case 'PrimaryCTA':
      return <PrimaryCtaFields content={content} update={update} onChange={onChange} />
    case 'SecondaryCTA':
      return <SecondaryCtaFields content={content} update={update} />
    case 'CardGrid':
      return <CardGridFields content={content} onChange={onChange} />
    case 'FAQ':
      return <FaqFields content={content} onChange={onChange} />
    case 'Breadcrumbs':
      return <BreadcrumbsFields content={content} onChange={onChange} />
    case 'TrustBar':
      return <TrustBarFields content={content} onChange={onChange} />
    case 'HowItWorks':
      return <HowItWorksFields content={content} onChange={onChange} />
    case 'ServiceAreaMap':
      return <ServiceAreaMapFields content={content} update={update} onChange={onChange} />
    case 'LocalProTips':
      return <LocalProTipsFields content={content} onChange={onChange} />
    case 'Gallery':
      return <GalleryFields content={content} update={update} onChange={onChange} />
    case 'Testimonials':
      return <TestimonialsFields content={content} update={update} onChange={onChange} />
    case 'Contact':
      return <ContactFields content={content} update={update} onChange={onChange} />
    case 'Form':
      return <FormFields content={content} update={update} />
    case 'Blog':
      return <BlogFields content={content} update={update} onChange={onChange} />
    default:
      return <GenericFields content={content} onChange={onChange} />
  }
}

/* Shared helpers */

const inputClass = 'w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pumpkin-500'
const labelClass = 'block text-xs font-medium text-neutral-600 mb-1'

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {multiline ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputClass} rows={3} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
      )}
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input type="number" value={value ?? 0} onChange={e => onChange(parseInt(e.target.value) || 0)} className={inputClass} />
    </div>
  )
}

function ArrayManager<T>({ label, items, onUpdate, renderItem, createItem }: {
  label: string; items: T[]; onUpdate: (items: T[]) => void; renderItem: (item: T, index: number, update: (item: T) => void) => ReactNode; createItem: () => T
}) {
  const add = () => onUpdate([...items, createItem()])
  const remove = (i: number) => onUpdate(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, item: T) => onUpdate(items.map((it, idx) => idx === i ? item : it))
  const moveUp = (i: number) => {
    if (i === 0) return
    const arr = [...items];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    onUpdate(arr)
  }
  const moveDown = (i: number) => {
    if (i >= items.length - 1) return
    const arr = [...items];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    onUpdate(arr)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-neutral-600">{label} ({items.length})</label>
        <button type="button" onClick={add} className="text-xs px-2 py-1 bg-pumpkin-50 text-pumpkin-700 rounded hover:bg-pumpkin-100">+ Add</button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-500 font-medium">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30" title="Move up" aria-label="Move up">
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => moveDown(i)} disabled={i >= items.length - 1} className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30" title="Move down" aria-label="Move down">
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => remove(i)} className="ml-1 rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600" title="Remove" aria-label="Remove">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
            {renderItem(item, i, (updated) => updateItem(i, updated))}
          </div>
        ))}
      </div>
    </div>
  )
}

function TagsInput({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInput('')
    }
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex gap-2 mb-1">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} placeholder="Type and press Enter" className={inputClass} />
        <button type="button" onClick={add} className="px-3 py-2 bg-neutral-100 text-neutral-600 rounded-md text-sm hover:bg-neutral-200 shrink-0">Add</button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {value.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-pumpkin-50 text-pumpkin-700 text-xs rounded-full">
              {tag}
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="hover:text-pumpkin-900" title="Remove tag" aria-label="Remove tag">
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* Hero */

function HeroFields({ content, update, onChange }: { content: any; update: (k: string, v: any) => void; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Variant</label>
        <select value={content.type || 'Main'} onChange={e => update('type', e.target.value)} className={inputClass}>
          <option value="Main">Main</option>
          <option value="Secondary">Secondary</option>
          <option value="Tertiary">Tertiary</option>
        </select>
      </div>
      <Field label="Headline" value={content.headline} onChange={v => update('headline', v)} placeholder="Main headline" />
      <Field label="Subheadline" value={content.subheadline} onChange={v => update('subheadline', v)} placeholder="Supporting text" />
      <div className="grid grid-cols-2 gap-3">
        <MediaField
          label="Background Image URL"
          value={content.backgroundImage}
          onChange={v => update('backgroundImage', v)}
          onSelect={asset => onChange({
            ...content,
            backgroundImage: asset.publicUrl,
            backgroundImageAltText: content.backgroundImageAltText || mediaAlt(asset),
          })}
        />
        <Field label="Background Image Alt" value={content.backgroundImageAltText} onChange={v => update('backgroundImageAltText', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MediaField
          label="Main Image URL"
          value={content.mainImage}
          onChange={v => update('mainImage', v)}
          onSelect={asset => onChange({
            ...content,
            mainImage: asset.publicUrl,
            mainImageAltText: content.mainImageAltText || mediaAlt(asset),
          })}
        />
        <Field label="Main Image Alt" value={content.mainImageAltText} onChange={v => update('mainImageAltText', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Button Text" value={content.buttonText} onChange={v => update('buttonText', v)} />
        <Field label="Button Link" value={content.buttonLink} onChange={v => update('buttonLink', v)} />
      </div>
    </div>
  )
}

/* Primary CTA */

function PrimaryCtaFields({ content, update, onChange }: { content: any; update: (k: string, v: any) => void; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Description" value={content.description} onChange={v => update('description', v)} multiline />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Button Text" value={content.buttonText} onChange={v => update('buttonText', v)} />
        <Field label="Button Link" value={content.buttonLink} onChange={v => update('buttonLink', v)} />
      </div>
      <Field label="Secondary Text" value={content.secondaryText} onChange={v => update('secondaryText', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Secondary Link Text" value={content.secondaryLinkText} onChange={v => update('secondaryLinkText', v)} />
        <Field label="Secondary Link" value={content.secondaryLink} onChange={v => update('secondaryLink', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MediaField label="Background Image" value={content.backgroundImage} onChange={v => update('backgroundImage', v)} />
        <MediaField
          label="Main Image"
          value={content.mainImage}
          onChange={v => update('mainImage', v)}
          onSelect={asset => onChange({
            ...content,
            mainImage: asset.publicUrl,
            alt: content.alt || mediaAlt(asset),
          })}
        />
      </div>
      <Field label="Image Alt" value={content.alt} onChange={v => update('alt', v)} />
    </div>
  )
}

/* Secondary CTA */

function SecondaryCtaFields({ content, update }: { content: any; update: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Description" value={content.description} onChange={v => update('description', v)} multiline />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Button Text" value={content.buttonText} onChange={v => update('buttonText', v)} />
        <Field label="Button Link" value={content.buttonLink} onChange={v => update('buttonLink', v)} />
      </div>
    </div>
  )
}

/* Card Grid */

function CardGridFields({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const update = (k: string, v: any) => onChange({ ...content, [k]: v })
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Subtitle" value={content.subtitle} onChange={v => update('subtitle', v)} />
      <div>
        <label className={labelClass}>Layout</label>
        <select value={content.layout || 'grid-3'} onChange={e => update('layout', e.target.value)} className={inputClass}>
          <option value="grid-2">2 Columns</option>
          <option value="grid-3">3 Columns</option>
          <option value="grid-4">4 Columns</option>
        </select>
      </div>
      <ArrayManager
        label="Cards"
        items={content.cards || []}
        onUpdate={cards => update('cards', cards)}
        createItem={() => ({ title: '', description: '', image: '', 'image-alt': '', icon: '', link: '', alt: '' })}
        renderItem={(card: any, _, updateCard) => (
          <div className="space-y-2">
            <Field label="Title" value={card.title} onChange={v => updateCard({ ...card, title: v })} />
            <Field label="Description" value={card.description} onChange={v => updateCard({ ...card, description: v })} />
            <div className="grid grid-cols-2 gap-2">
              <MediaField
                label="Image URL"
                value={card.image}
                onChange={v => updateCard({ ...card, image: v })}
                onSelect={asset => updateCard({ ...card, image: asset.publicUrl, 'image-alt': card['image-alt'] || mediaAlt(asset) })}
              />
              <Field label="Image Alt" value={card['image-alt']} onChange={v => updateCard({ ...card, 'image-alt': v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Icon" value={card.icon} onChange={v => updateCard({ ...card, icon: v })} />
              <Field label="Link" value={card.link} onChange={v => updateCard({ ...card, link: v })} />
            </div>
          </div>
        )}
      />
    </div>
  )
}

/* FAQ */

function FaqFields({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const update = (k: string, v: any) => onChange({ ...content, [k]: v })
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Subtitle" value={content.subtitle} onChange={v => update('subtitle', v)} />
      <ArrayManager
        label="FAQ Items"
        items={content.items || []}
        onUpdate={items => update('items', items)}
        createItem={() => ({ question: '', answer: '' })}
        renderItem={(item: any, _, updateItem) => (
          <div className="space-y-2">
            <Field label="Question" value={item.question} onChange={v => updateItem({ ...item, question: v })} />
            <Field label="Answer" value={item.answer} onChange={v => updateItem({ ...item, answer: v })} multiline />
          </div>
        )}
      />
    </div>
  )
}

/* Breadcrumbs */

function BreadcrumbsFields({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <ArrayManager
      label="Breadcrumb Items"
      items={content.items || []}
      onUpdate={items => onChange({ ...content, items })}
      createItem={() => ({ label: '', url: '', current: false })}
      renderItem={(item: any, _, updateItem) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Label" value={item.label} onChange={v => updateItem({ ...item, label: v })} />
            <Field label="URL" value={item.url} onChange={v => updateItem({ ...item, url: v })} />
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            <input type="checkbox" checked={item.current || false} onChange={e => updateItem({ ...item, current: e.target.checked })} className="rounded border-neutral-300 text-pumpkin-600" />
            Current page
          </label>
        </div>
      )}
    />
  )
}

/* Trust Bar */

function TrustBarFields({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <ArrayManager
      label="Trust Items"
      items={content.items || []}
      onUpdate={items => onChange({ ...content, items })}
      createItem={() => ({ icon: '', title: '', text: '', alt: '' })}
      renderItem={(item: any, _, updateItem) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Icon" value={item.icon} onChange={v => updateItem({ ...item, icon: v })} />
            <Field label="Title" value={item.title} onChange={v => updateItem({ ...item, title: v })} />
          </div>
          <Field label="Text" value={item.text} onChange={v => updateItem({ ...item, text: v })} />
          <Field label="Alt" value={item.alt} onChange={v => updateItem({ ...item, alt: v })} />
        </div>
      )}
    />
  )
}

/* How It Works */

function HowItWorksFields({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const update = (k: string, v: any) => onChange({ ...content, [k]: v })
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <ArrayManager
        label="Steps"
        items={content.steps || []}
        onUpdate={steps => update('steps', steps)}
        createItem={() => ({ title: '', text: '', image: '', alt: '' })}
        renderItem={(step: any, _, updateStep) => (
          <div className="space-y-2">
            <Field label="Title" value={step.title} onChange={v => updateStep({ ...step, title: v })} />
            <Field label="Text" value={step.text} onChange={v => updateStep({ ...step, text: v })} multiline />
            <div className="grid grid-cols-2 gap-2">
              <MediaField
                label="Image URL"
                value={step.image}
                onChange={v => updateStep({ ...step, image: v })}
                onSelect={asset => updateStep({ ...step, image: asset.publicUrl, alt: step.alt || mediaAlt(asset) })}
              />
              <Field label="Image Alt" value={step.alt} onChange={v => updateStep({ ...step, alt: v })} />
            </div>
          </div>
        )}
      />
    </div>
  )
}

/* Service Area Map */

function ServiceAreaMapFields({ content, update, onChange }: { content: any; update: (k: string, v: any) => void; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Subtitle" value={content.subtitle} onChange={v => update('subtitle', v)} />
      <Field label="Map Embed URL" value={content.mapEmbedUrl} onChange={v => update('mapEmbedUrl', v)} placeholder="Google Maps embed URL" />
      <TagsInput label="Neighborhoods" value={content.neighborhoods || []} onChange={v => onChange({ ...content, neighborhoods: v })} />
      <TagsInput label="Zip Codes" value={content.zipCodes || []} onChange={v => onChange({ ...content, zipCodes: v })} />
      <TagsInput label="Nearby Cities" value={content.nearbyCities || []} onChange={v => onChange({ ...content, nearbyCities: v })} />
    </div>
  )
}

/* Local Pro Tips */

function LocalProTipsFields({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const update = (k: string, v: any) => onChange({ ...content, [k]: v })
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <ArrayManager
        label="Tips"
        items={content.items || []}
        onUpdate={items => update('items', items)}
        createItem={() => ({ icon: '', image: '', title: '', text: '' })}
        renderItem={(item: any, _, updateItem) => (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Icon" value={item.icon} onChange={v => updateItem({ ...item, icon: v })} />
              <MediaField label="Image" value={item.image} onChange={v => updateItem({ ...item, image: v })} />
            </div>
            <Field label="Title" value={item.title} onChange={v => updateItem({ ...item, title: v })} />
            <Field label="Text" value={item.text} onChange={v => updateItem({ ...item, text: v })} multiline />
          </div>
        )}
      />
    </div>
  )
}

/* Gallery */

function GalleryFields({ content, update, onChange }: { content: any; update: (k: string, v: any) => void; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Subtitle" value={content.subtitle} onChange={v => update('subtitle', v)} />
      <ArrayManager
        label="Images"
        items={content.images || []}
        onUpdate={images => onChange({ ...content, images })}
        createItem={() => ({ src: '', alt: '', caption: '' })}
        renderItem={(img: any, _, updateImg) => (
          <div className="space-y-2">
            <MediaField
              label="Image URL"
              value={img.src}
              onChange={v => updateImg({ ...img, src: v })}
              onSelect={asset => updateImg({ ...img, src: asset.publicUrl, alt: img.alt || mediaAlt(asset), caption: img.caption || asset.caption })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Alt Text" value={img.alt} onChange={v => updateImg({ ...img, alt: v })} />
              <Field label="Caption" value={img.caption} onChange={v => updateImg({ ...img, caption: v })} />
            </div>
          </div>
        )}
      />
    </div>
  )
}

/* Testimonials */

function TestimonialsFields({ content, update, onChange }: { content: any; update: (k: string, v: any) => void; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Subtitle" value={content.subtitle} onChange={v => update('subtitle', v)} />
      <div>
        <label className={labelClass}>Layout</label>
        <select value={content.layout || 'carousel'} onChange={e => update('layout', e.target.value)} className={inputClass}>
          <option value="carousel">Carousel</option>
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select>
      </div>
      <ArrayManager
        label="Testimonials"
        items={content.items || []}
        onUpdate={items => onChange({ ...content, items })}
        createItem={() => ({ quote: '', author: '', eventType: '', rating: 5 })}
        renderItem={(item: any, _, updateItem) => (
          <div className="space-y-2">
            <Field label="Quote" value={item.quote} onChange={v => updateItem({ ...item, quote: v })} multiline />
            <div className="grid grid-cols-3 gap-2">
              <Field label="Author" value={item.author} onChange={v => updateItem({ ...item, author: v })} />
              <Field label="Event Type" value={item.eventType} onChange={v => updateItem({ ...item, eventType: v })} />
              <NumberField label="Rating (1-5)" value={item.rating} onChange={v => updateItem({ ...item, rating: Math.min(5, Math.max(1, v)) })} />
            </div>
          </div>
        )}
      />
    </div>
  )
}

/* Contact */

function ContactFields({ content, update, onChange }: { content: any; update: (k: string, v: any) => void; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Subtitle" value={content.subtitle} onChange={v => update('subtitle', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Address" value={content.address} onChange={v => update('address', v)} />
        <Field label="Phone" value={content.phone} onChange={v => update('phone', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" value={content.email} onChange={v => update('email', v)} />
        <Field label="Hours" value={content.hours} onChange={v => update('hours', v)} />
      </div>
      <Field label="Submit Button Text" value={content.submitButtonText} onChange={v => update('submitButtonText', v)} />
      <ArrayManager
        label="Form Fields"
        items={content.formFields || []}
        onUpdate={fields => onChange({ ...content, formFields: fields })}
        createItem={() => ({ label: '', type: 'text', required: false, placeholder: '' })}
        renderItem={(field: any, _, updateField) => (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Label" value={field.label} onChange={v => updateField({ ...field, label: v })} />
              <div>
                <label className={labelClass}>Type</label>
                <select value={field.type || 'text'} onChange={e => updateField({ ...field, type: e.target.value })} className={inputClass}>
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Field label="Placeholder" value={field.placeholder} onChange={v => updateField({ ...field, placeholder: v })} />
              <label className="flex items-center gap-2 text-xs text-neutral-600 pt-5 shrink-0">
                <input type="checkbox" checked={field.required || false} onChange={e => updateField({ ...field, required: e.target.checked })} className="rounded border-neutral-300 text-pumpkin-600" />
                Required
              </label>
            </div>
          </div>
        )}
      />
      <ArrayManager
        label="Social Links"
        items={content.socialLinks || []}
        onUpdate={links => onChange({ ...content, socialLinks: links })}
        createItem={() => ({ platform: '', url: '', icon: '' })}
        renderItem={(link: any, _, updateLink) => (
          <div className="grid grid-cols-3 gap-2">
            <Field label="Platform" value={link.platform} onChange={v => updateLink({ ...link, platform: v })} />
            <Field label="URL" value={link.url} onChange={v => updateLink({ ...link, url: v })} />
            <Field label="Icon" value={link.icon} onChange={v => updateLink({ ...link, icon: v })} />
          </div>
        )}
      />
    </div>
  )
}

/* Form */

function FormFields({ content, update }: { content: any; update: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Form Type" value={content.formType} onChange={v => update('formType', v)} placeholder="contact" />
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Subtitle" value={content.subtitle} onChange={v => update('subtitle', v)} />
      <Field label="Description" value={content.description} onChange={v => update('description', v)} multiline />
      <div>
        <label className={labelClass}>Layout</label>
        <select value={content.layout || 'default'} onChange={e => update('layout', e.target.value)} className={inputClass}>
          <option value="default">Default</option>
          <option value="compact">Compact</option>
          <option value="split">Split</option>
        </select>
      </div>
      <Field label="Fallback Success Message" value={content.successMessage} onChange={v => update('successMessage', v)} multiline />
    </div>
  )
}

function MediaField({
  label,
  value,
  onChange,
  onSelect,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSelect?: (asset: MediaAsset) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const selectAsset = (asset: MediaAsset) => {
    if (onSelect) {
      onSelect(asset)
    } else {
      onChange(asset.publicUrl)
    }
    setPickerOpen(false)
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          <span>Media</span>
        </button>
      </div>
      {pickerOpen && (
        <MediaPickerDialog
          onClose={() => setPickerOpen(false)}
          onSelect={selectAsset}
          title={label}
        />
      )}
    </div>
  )
}

function mediaAlt(asset: MediaAsset) {
  return asset.altText || asset.caption || asset.fileName
}

/* Blog */

function BlogFields({ content, update, onChange }: { content: any; update: (k: string, v: any) => void; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title" value={content.title} onChange={v => update('title', v)} />
      <Field label="Subtitle" value={content.subtitle} onChange={v => update('subtitle', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Author" value={content.author} onChange={v => update('author', v)} />
        <Field label="Published Date" value={content.publishedDate} onChange={v => update('publishedDate', v)} type="date" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MediaField label="Author Image URL" value={content.authorImage} onChange={v => update('authorImage', v)} />
        <NumberField label="Reading Time (min)" value={content.readingTime} onChange={v => update('readingTime', v)} />
      </div>
      <Field label="Author Bio" value={content.authorBio} onChange={v => update('authorBio', v)} multiline />
      <Field label="Excerpt" value={content.excerpt} onChange={v => update('excerpt', v)} multiline />
      <div className="grid grid-cols-2 gap-3">
        <MediaField
          label="Featured Image URL"
          value={content.featuredImage}
          onChange={v => update('featuredImage', v)}
          onSelect={asset => onChange({
            ...content,
            featuredImage: asset.publicUrl,
            featuredImageAlt: content.featuredImageAlt || mediaAlt(asset),
          })}
        />
        <Field label="Featured Image Alt" value={content.featuredImageAlt} onChange={v => update('featuredImageAlt', v)} />
      </div>
      <Field label="Body (HTML/Markdown)" value={content.body} onChange={v => update('body', v)} multiline />
      <TagsInput label="Tags" value={content.tags || []} onChange={v => onChange({ ...content, tags: v })} />
      <TagsInput label="Categories" value={content.categories || []} onChange={v => onChange({ ...content, categories: v })} />
      <ArrayManager
        label="Related Posts"
        items={content.relatedPosts || []}
        onUpdate={posts => onChange({ ...content, relatedPosts: posts })}
        createItem={() => ({ title: '', slug: '', excerpt: '', image: '', imageAlt: '', publishedDate: '' })}
        renderItem={(post: any, _, updatePost) => (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Title" value={post.title} onChange={v => updatePost({ ...post, title: v })} />
              <Field label="Slug" value={post.slug} onChange={v => updatePost({ ...post, slug: v })} />
            </div>
            <Field label="Excerpt" value={post.excerpt} onChange={v => updatePost({ ...post, excerpt: v })} />
            <div className="grid grid-cols-2 gap-2">
              <MediaField
                label="Image"
                value={post.image}
                onChange={v => updatePost({ ...post, image: v })}
                onSelect={asset => updatePost({ ...post, image: asset.publicUrl, imageAlt: post.imageAlt || mediaAlt(asset) })}
              />
              <Field label="Published Date" value={post.publishedDate} onChange={v => updatePost({ ...post, publishedDate: v })} type="date" />
            </div>
          </div>
        )}
      />
    </div>
  )
}

/* Generic fallback */

function GenericFields({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const [raw, setRaw] = useState(JSON.stringify(content, null, 2))
  const [error, setError] = useState<string | null>(null)

  const apply = () => {
    try {
      onChange(JSON.parse(raw))
      setError(null)
    } catch {
      setError('Invalid JSON')
    }
  }

  return (
    <div className="space-y-2">
      <label className={labelClass}>Raw JSON Content</label>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} className={`${inputClass} font-mono text-xs`} rows={10} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="button" onClick={apply} className="text-xs px-3 py-1 bg-pumpkin-50 text-pumpkin-700 rounded hover:bg-pumpkin-100">Apply JSON</button>
    </div>
  )
}

