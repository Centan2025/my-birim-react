import { ReactNode, Fragment } from 'react'
import { sanitizeText, sanitizeUrl } from '../lib/sanitize'
import { OptimizedImage } from './OptimizedImage'
import { urlFor } from '../lib/imageUrl'

type Span = { _type: 'span'; text: string; marks?: string[] }
type MarkDef = {
  _key?: string
  _type?: string
  href?: string
  blank?: boolean
  reference?: { _ref: string; _type: string }
}

type Block = {
  _type?: string
  style?: string
  children?: Span[]
  markDefs?: MarkDef[]
  listItem?: 'bullet' | 'number'
  level?: number
  _key?: string
  // For custom objects
  asset?: any
  alt?: string
  caption?: string
  layout?: 'full' | 'center' | 'left' | 'right'
  url?: string
  style_type?: string // for divider or cta
  text?: any // for cta (localized)
  link?: string // for cta
}

function renderInline(spans: Span[] = [], markDefs: MarkDef[] = []) {
  return spans.map((s, i) => {
    const sanitizedText = sanitizeText(s.text)
    let el: ReactNode = sanitizedText

    if (s.marks && s.marks.length) {
      // Sort marks to ensure consistent nesting (decorators first, then links)
      const sortedMarks = [...s.marks].sort((a, b) => {
        const aIsDef = markDefs.some(d => d._key === a)
        const bIsDef = markDefs.some(d => d._key === b)
        if (aIsDef && !bIsDef) return 1
        if (!aIsDef && bIsDef) return -1
        return 0
      })

      sortedMarks.forEach(m => {
        // Decorators
        if (m === 'strong') el = <strong key={i + '-strong'}>{el}</strong>
        if (m === 'em') el = <em key={i + '-em'}>{el}</em>
        if (m === 'underline') el = <u key={i + '-u'}>{el}</u>
        if (m === 'strike-through') el = <del key={i + '-del'}>{el}</del>
        if (m === 'code')
          el = (
            <code key={i + '-code'} className="bg-gray-100 px-1 rounded text-sm font-mono">
              {el}
            </code>
          )

        // Annotations (Links)
        const def = markDefs.find(d => d?._key === m)
        if (def) {
          if (def._type === 'link' && def.href) {
            const sanitizedHref = sanitizeUrl(def.href || '')
            if (sanitizedHref) {
              el = (
                <a
                  key={i + '-a'}
                  href={sanitizedHref}
                  target={def.blank ? '_blank' : undefined}
                  rel={def.blank ? 'noopener noreferrer' : undefined}
                  className="underline hover:no-underline text-gray-950 font-medium"
                >
                  {el}
                </a>
              )
            }
          }
          // Internal Link Placeholder - Requires a resolver to be truly functional
          if (def._type === 'internalLink' && def.reference) {
            el = (
              <span key={i + '-internal'} className="border-b border-dotted border-gray-400" title="İç Bağlantı">
                {el}
              </span>
            )
          }
        }
      })
    }
    return <Fragment key={i}>{el}</Fragment>
  })
}

export default function PortableTextLite({ value }: { value: Block[] | undefined }) {
  if (!Array.isArray(value) || value.length === 0) return null

  const nodes: ReactNode[] = []
  let listBuffer: { type: 'ul' | 'ol'; items: ReactNode[] } | null = null
  let listCounter = 0

  const flushList = () => {
    if (!listBuffer) return
    const listKey = `list-${listCounter++}`
    nodes.push(
      listBuffer.type === 'ul' ? (
        <ul className="list-disc pl-6 my-6 space-y-2 text-gray-800" key={listKey}>
          {listBuffer.items}
        </ul>
      ) : (
        <ol className="list-decimal pl-6 my-6 space-y-2 text-gray-800" key={listKey}>
          {listBuffer.items}
        </ol>
      )
    )
    listBuffer = null
  }

  for (let idx = 0; idx < value.length; idx++) {
    const block = value[idx]
    if (!block) continue

    const blockKey = block._key || `block-${idx}`

    // Handle Lists
    if (block.listItem) {
      const type = block.listItem === 'bullet' ? 'ul' : 'ol'
      const item = (
        <li key={blockKey} className="leading-relaxed">
          {renderInline(block.children as Span[], block.markDefs || [])}
        </li>
      )
      if (!listBuffer || listBuffer.type !== type) {
        flushList()
        listBuffer = { type, items: [item] }
      } else {
        listBuffer.items.push(item)
      }
      continue
    }

    flushList()

    // Handle Image Pairing Logic (Side by Side for consecutive left/right images)
    if (
      block._type === 'image' &&
      block.asset &&
      (block.layout === 'left' || block.layout === 'right')
    ) {
      const nextBlock = value[idx + 1]
      if (
        nextBlock &&
        nextBlock._type === 'image' &&
        nextBlock.asset &&
        (nextBlock.layout === 'left' || nextBlock.layout === 'right') &&
        nextBlock.layout !== block.layout
      ) {
        // PAIR DETECTED
        nodes.push(
          <div key={`pair-${blockKey}`} className="flex flex-row gap-2 my-2 clear-both">
            <figure className="flex-1">
              <OptimizedImage
                src={urlFor(block.asset).url() || ''}
                alt={block.alt || ''}
                className="w-full h-auto shadow-sm"
              />
              {block.caption && (
                <figcaption className="mt-3 text-sm text-gray-500 text-center italic">
                  {block.caption}
                </figcaption>
              )}
            </figure>
            <figure className="flex-1">
              <OptimizedImage
                src={urlFor(nextBlock.asset).url() || ''}
                alt={nextBlock.alt || ''}
                className="w-full h-auto shadow-sm"
              />
              {nextBlock.caption && (
                <figcaption className="mt-3 text-sm text-gray-500 text-center italic">
                  {nextBlock.caption}
                </figcaption>
              )}
            </figure>
          </div>
        )
        idx++ // Skip next block
        continue
      }
    }

    // Handle Standard Blocks
    if (block._type === 'block') {
      const style = block.style || 'normal'
      const content = renderInline(block.children as Span[], block.markDefs || [])

      switch (style) {
        case 'h1':
          nodes.push(
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold my-8 leading-tight text-gray-950"
              key={blockKey}
            >
              {content}
            </h1>
          )
          break
        case 'h2':
          nodes.push(
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold my-7 leading-snug text-gray-950"
              key={blockKey}
            >
              {content}
            </h2>
          )
          break
        case 'h3':
          nodes.push(
            <h3
              className="text-2xl md:text-3xl lg:text-4xl font-semibold my-6 text-gray-900"
              key={blockKey}
            >
              {content}
            </h3>
          )
          break
        case 'h4':
          nodes.push(
            <h4
              className="text-xl md:text-2xl lg:text-3xl font-semibold my-5 text-gray-900"
              key={blockKey}
            >
              {content}
            </h4>
          )
          break
        case 'h5':
          nodes.push(
            <h5
              className="text-lg md:text-xl lg:text-2xl font-medium my-4 text-gray-950"
              key={blockKey}
            >
              {content}
            </h5>
          )
          break
        case 'h6':
          nodes.push(
            <h6
              className="text-base md:text-lg lg:text-xl font-medium my-3 text-gray-950"
              key={blockKey}
            >
              {content}
            </h6>
          )
          break
        case 'blockquote':
          nodes.push(
            <blockquote
              className="border-l-4 border-gray-300 pl-6 my-8 italic text-xl md:text-2xl text-gray-600 leading-relaxed"
              key={blockKey}
            >
              {content}
            </blockquote>
          )
          break
        default:
          nodes.push(
            <p className="my-4 leading-relaxed text-gray-950" key={blockKey}>
              {content}
            </p>
          )
      }
      continue
    }

    // Handle Custom Objects
    if (block._type === 'image' && block.asset) {
      const layoutClass =
        block.layout === 'left'
          ? 'md:float-left md:mr-8 md:mb-4 md:w-1/2'
          : block.layout === 'right'
            ? 'md:float-right md:ml-8 md:mb-4 md:w-1/2'
            : block.layout === 'center'
              ? 'mx-auto md:w-3/4'
              : 'w-full'

      nodes.push(
        <figure key={blockKey} className={`my-2 clear-both ${layoutClass}`}>
          <OptimizedImage
            src={urlFor(block.asset).url() || ''}
            alt={block.alt || ''}
            className="w-full h-auto shadow-sm"
          />
          {block.caption && (
            <figcaption className="mt-3 text-sm text-gray-500 text-center italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )
    }

    if (block._type === 'youtube' && block.url) {
      const videoId = block.url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      )?.[1]
      if (videoId) {
        nodes.push(
          <div key={blockKey} className="my-10">
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                allowFullScreen
                title={block.caption || 'YouTube Video'}
              />
            </div>
            {block.caption && (
              <p className="mt-3 text-sm text-gray-500 text-center italic">{block.caption}</p>
            )}
          </div>
        )
      }
    }

    if (block._type === 'divider') {
      const borderStyle =
        block.style === 'thick'
          ? 'border-t-4'
          : block.style === 'dotted'
            ? 'border-t border-dotted'
            : 'border-t'
      nodes.push(<hr key={blockKey} className={`my-12 border-gray-200 ${borderStyle}`} />)
    }

    if (block._type === 'cta' && block.link) {
      // Simple CTA Button
      const btnStyle =
        block.style === 'secondary'
          ? 'bg-white text-gray-950 border border-gray-950 hover:bg-gray-50'
          : block.style === 'outline'
            ? 'bg-transparent text-gray-950 border border-gray-300 hover:border-gray-950'
            : 'bg-gray-950 text-white hover:bg-gray-800'

      const label =
        typeof block.text === 'string' ? block.text : block.text?.tr || block.text?.en || 'Devam Et'

      nodes.push(
        <div key={blockKey} className="my-8 flex justify-center">
          <a
            href={block.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block px-8 py-3 font-bold transition-all duration-300 ${btnStyle}`}
          >
            {label}
          </a>
        </div>
      )
    }
  }

  flushList()
  return <div className="portable-text-container">{nodes}</div>
}
