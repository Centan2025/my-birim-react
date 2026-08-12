import {ReactNode, Fragment} from 'react'
import {sanitizeText, sanitizeUrl} from '../lib/sanitize'
import {OptimizedImage} from './OptimizedImage'
import {urlFor} from '../lib/imageUrl'
import {mapR2Metadata} from '../services/sanity/client'

type Span = {_type: 'span'; text: string; marks?: string[]}
type MarkDef = {
  _key?: string
  _type?: string
  href?: string
  blank?: boolean
  reference?: {_ref: string; _type: string}
  color?: string
  size?: string
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asset?: any
  alt?: string
  caption?: string
  layout?: 'full' | 'center' | 'left' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
  url?: string
  style_type?: string // for divider or cta
  align?: 'left' | 'center' | 'right' // for cta positioning
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text?: any // for cta (localized)
  link?: string // for cta
  // For R2-based portableTextImage
  imageR2?: {
    url?: string
    path?: string
    alt?: string
    cropX?: number
    cropY?: number
    cropWidth?: number
    cropHeight?: number
    hotspotX?: number
    hotspotY?: number
  }
}

function renderInline(spans: Span[] = [], markDefs: MarkDef[] = []) {
  return spans.map((s, i) => {
    const sanitizedText = sanitizeText(s.text)
    let el: ReactNode = sanitizedText

    if (s.marks && s.marks.length) {
      // Sort marks to ensure consistent nesting (decorators first, then annotations)
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
            <code
              key={i + '-code'}
              className="bg-[var(--bg-tertiary)] px-1 rounded text-sm font-mono text-[var(--text-primary)]"
            >
              {el}
            </code>
          )
        let matchedFontSize: string | null = null

        if (m === 'size-sm') matchedFontSize = '14px'
        else if (m === 'size-md') matchedFontSize = '18px'
        else if (m === 'size-lg') matchedFontSize = '24px'
        else if (m === 'size-xl') matchedFontSize = '32px'
        else if (m === 'size-2xl') matchedFontSize = '48px'
        else if (m.startsWith('size-') || m.startsWith('font-size-')) {
          const val = m.replace('font-size-', '').replace('size-', '')
          if (val === 'xs') matchedFontSize = '12px'
          else if (val === 'sm') matchedFontSize = '14px'
          else if (val === 'base') matchedFontSize = '16px'
          else if (val === 'md') matchedFontSize = '18px'
          else if (val === 'lg') matchedFontSize = '24px'
          else if (val === 'xl') matchedFontSize = '32px'
          else if (val === '2xl') matchedFontSize = '48px'
          else if (val === '3xl') matchedFontSize = '64px'
          else if (/^\d+$/.test(val)) matchedFontSize = `${val}px`
          else if (
            val.endsWith('px') ||
            val.endsWith('em') ||
            val.endsWith('rem') ||
            val.endsWith('%')
          ) {
            matchedFontSize = val
          }
        }

        if (matchedFontSize) {
          el = (
            <span key={i + '-' + m} style={{fontSize: matchedFontSize}}>
              {el}
            </span>
          )
        }

        // Annotations
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
                  className="underline hover:no-underline text-[var(--text-primary)] font-medium"
                >
                  {el}
                </a>
              )
            }
          }
          // Internal Link Placeholder - Requires a resolver to be truly functional
          if (def._type === 'internalLink' && def.reference) {
            el = (
              <span
                key={i + '-internal'}
                className="border-b border-dotted border-gray-400"
                title="İç Bağlantı"
              >
                {el}
              </span>
            )
          }

          // Text Color Support
          if (def._type === 'textColor' && def.color) {
            const finalColor =
              typeof def.color === 'string' ? def.color : (def.color as {hex?: string}).hex
            if (finalColor) {
              el = (
                <span key={i + '-color'} style={{color: finalColor}}>
                  {el}
                </span>
              )
            }
          }

          // Font Size Support (Seçili metin boyutu)
          if (
            (def._type === 'fontSize' || def._type === 'size') &&
            (def.size ||
              (def as Record<string, string>)['value'] ||
              (def as Record<string, string>)['fontSize'])
          ) {
            const sizeVal =
              def.size ||
              (def as Record<string, string>)['value'] ||
              (def as Record<string, string>)['fontSize']
            if (sizeVal) {
              el = (
                <span key={i + '-size'} style={{fontSize: sizeVal}}>
                  {el}
                </span>
              )
            }
          }
        }
      })
    }
    return <Fragment key={i}>{el}</Fragment>
  })
}

export default function PortableTextLite({
  value,
  removeTopMargin = false,
  onMediaClick,
  isOverlay = false,
}: {
  value: Block[] | undefined
  removeTopMargin?: boolean
  onMediaClick?: (url: string) => void
  isOverlay?: boolean
}) {
  if (!Array.isArray(value) || value.length === 0) return null

  // Sort blocks stably by verticalAlign so bottom-aligned items are placed last in DOM order
  const sortedValue = [...value].sort((a, b) => {
    const rankA = a.verticalAlign === 'bottom' ? 2 : a.verticalAlign === 'center' ? 1 : 0
    const rankB = b.verticalAlign === 'bottom' ? 2 : b.verticalAlign === 'center' ? 1 : 0
    return rankA - rankB
  })

  const nodes: ReactNode[] = []
  let listBuffer: {type: 'ul' | 'ol'; items: ReactNode[]} | null = null
  let listCounter = 0

  const flushList = () => {
    if (!listBuffer) return
    const listKey = `list-${listCounter++}`
    nodes.push(
      listBuffer.type === 'ul' ? (
        <ul className="list-disc pl-6 my-6 space-y-2 text-[var(--text-primary)]" key={listKey}>
          {listBuffer.items}
        </ul>
      ) : (
        <ol className="list-decimal pl-6 my-6 space-y-2 text-[var(--text-primary)]" key={listKey}>
          {listBuffer.items}
        </ol>
      )
    )
    listBuffer = null
  }

  let isFirstNode = removeTopMargin

  const applyTopMarginRemoval = (className: string) => {
    if (!isFirstNode) return className
    const newClass = className.replace(/\bmy-(\d+)\b/g, 'mb-$1 !mt-0')
    return newClass.includes('!mt-0') ? newClass : `${newClass} !mt-0`
  }

  for (let idx = 0; idx < sortedValue.length; idx++) {
    const block = sortedValue[idx]
    if (!block) continue

    // Check if block is practically empty text (to avoid removing margin from invisible blocks)
    let isEmptyText = false
    if (block._type === 'block' && block.children) {
      const text = block.children
        .map(c => c.text || '')
        .join('')
        .trim()
      if (
        !text &&
        !block.children.some(c => c._type !== 'span' || (c.text && c.text.trim().length > 0))
      ) {
        isEmptyText = true
      }
    }
    if (isEmptyText) continue // Skip empty paragraphs entirely

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
        // Here we could handle top margin for the list container when it flushes
        listBuffer = {type, items: [item]}
      } else {
        listBuffer.items.push(item)
      }
      isFirstNode = false
      continue
    }

    flushList()

    // Handle Image Pairing Logic (Side by Side for consecutive left/right images)
    const isImageBlock = (b: Block) =>
      (b._type === 'image' && b.asset) || (b._type === 'portableTextImage' && b.imageR2?.url)
    const getImageSrc = (b: Block) =>
      b._type === 'portableTextImage' && b.imageR2?.url
        ? b.imageR2.url
        : b.asset
          ? urlFor(b).url() || ''
          : ''
    const getImageAlt = (b: Block) => b.alt || b.imageR2?.alt || ''

    const getImageCrop = (b: Block) => mapR2Metadata(b.imageR2 || b).crop
    const getImageHotspot = (b: Block) => mapR2Metadata(b.imageR2 || b).hotspot
    const getImageOrigWidth = (b: Block) => mapR2Metadata(b.imageR2 || b).origWidth
    const getImageOrigHeight = (b: Block) => mapR2Metadata(b.imageR2 || b).origHeight

    if (isImageBlock(block) && (block.layout === 'left' || block.layout === 'right')) {
      let nextValidIndex = idx + 1
      let nextBlock = sortedValue[nextValidIndex]

      while (nextBlock) {
        let isNextEmptyText = false
        if (nextBlock._type === 'block' && nextBlock.children) {
          const text = nextBlock.children
            .map(c => c.text || '')
            .join('')
            .trim()
          if (
            !text &&
            !nextBlock.children.some(
              c => c._type !== 'span' || (c.text && c.text.trim().length > 0)
            )
          ) {
            isNextEmptyText = true
          }
        }
        if (!isNextEmptyText) {
          break
        }
        nextValidIndex++
        nextBlock = sortedValue[nextValidIndex]
      }

      if (
        nextBlock &&
        isImageBlock(nextBlock) &&
        (nextBlock.layout === 'left' || nextBlock.layout === 'right') &&
        nextBlock.layout !== block.layout
      ) {
        // PAIR DETECTED — dynamic vertical align (top, center, bottom)
        const pairVAlign = block.verticalAlign || nextBlock.verticalAlign || 'top'
        const vAlignClass =
          pairVAlign === 'center'
            ? 'items-center !order-50 !my-auto'
            : pairVAlign === 'bottom'
              ? 'items-end !order-last !mt-auto !mb-0'
              : 'items-start !order-first'

        nodes.push(
          <div
            key={`pair-${blockKey}`}
            className={`grid grid-cols-2 gap-2 my-2 clear-both ${vAlignClass} ${applyTopMarginRemoval('')}`}
          >
            <figure className="flex flex-col">
              <div className="relative w-full overflow-hidden">
                <OptimizedImage
                  src={getImageSrc(block)}
                  alt={getImageAlt(block)}
                  className="w-full h-auto shadow-sm cursor-pointer"
                  crop={getImageCrop(block)}
                  hotspot={getImageHotspot(block)}
                  origWidth={getImageOrigWidth(block)}
                  origHeight={getImageOrigHeight(block)}
                  onClick={() => onMediaClick?.(getImageSrc(block))}
                />
              </div>
              {block.caption && (
                <figcaption className="mt-3 text-sm text-gray-500 text-center italic">
                  {block.caption}
                </figcaption>
              )}
            </figure>
            <figure className="flex flex-col">
              <div className="relative w-full overflow-hidden">
                <OptimizedImage
                  src={getImageSrc(nextBlock)}
                  alt={getImageAlt(nextBlock)}
                  className="w-full h-auto shadow-sm cursor-pointer"
                  crop={getImageCrop(nextBlock)}
                  hotspot={getImageHotspot(nextBlock)}
                  origWidth={getImageOrigWidth(nextBlock)}
                  origHeight={getImageOrigHeight(nextBlock)}
                  onClick={() => onMediaClick?.(getImageSrc(nextBlock))}
                />
              </div>
              {nextBlock.caption && (
                <figcaption className="mt-3 text-sm text-gray-500 text-center italic">
                  {nextBlock.caption}
                </figcaption>
              )}
            </figure>
          </div>
        )
        idx = nextValidIndex // Skip next block
        continue
      }
    }

    // Handle Standard Blocks
    if (block._type === 'block') {
      const style = block.style || 'normal'
      const content = renderInline(block.children as Span[], block.markDefs || [])

      if (isOverlay) {
        switch (style) {
          case 'h1':
            nodes.push(
              <h1 className="text-[1.3em] font-bold my-1 leading-tight text-inherit" key={blockKey}>
                {content}
              </h1>
            )
            break
          case 'h2':
            nodes.push(
              <h2
                className="text-[1.15em] font-bold my-1 leading-tight text-inherit"
                key={blockKey}
              >
                {content}
              </h2>
            )
            break
          case 'h3':
            nodes.push(
              <h3
                className="text-[1.05em] font-semibold my-1 leading-snug text-inherit"
                key={blockKey}
              >
                {content}
              </h3>
            )
            break
          case 'h4':
            nodes.push(
              <h4
                className="text-[0.9em] font-medium my-1 leading-snug text-inherit"
                key={blockKey}
              >
                {content}
              </h4>
            )
            break
          case 'h5':
            nodes.push(
              <h5
                className="text-[0.8em] font-medium my-1 leading-normal text-inherit"
                key={blockKey}
              >
                {content}
              </h5>
            )
            break
          case 'h6':
            nodes.push(
              <h6
                className="text-[0.7em] font-normal my-1 leading-normal text-inherit"
                key={blockKey}
              >
                {content}
              </h6>
            )
            break
          case 'blockquote':
            nodes.push(
              <blockquote
                className="border-l-2 border-current pl-4 my-2 italic text-[0.9em] opacity-90 leading-relaxed text-inherit"
                key={blockKey}
              >
                {content}
              </blockquote>
            )
            break
          default:
            nodes.push(
              <p className="my-1 leading-relaxed text-inherit" key={blockKey}>
                {content}
              </p>
            )
        }
      } else {
        switch (style) {
          case 'h1':
            nodes.push(
              <h1
                className={applyTopMarginRemoval(
                  'text-4xl md:text-5xl lg:text-6xl font-bold my-8 leading-tight text-[var(--text-primary)]'
                )}
                key={blockKey}
              >
                {content}
              </h1>
            )
            break
          case 'h2':
            nodes.push(
              <h2
                className={applyTopMarginRemoval(
                  'text-3xl md:text-4xl lg:text-5xl font-bold my-7 leading-snug text-[var(--text-primary)]'
                )}
                key={blockKey}
              >
                {content}
              </h2>
            )
            break
          case 'h3':
            nodes.push(
              <h3
                className={applyTopMarginRemoval(
                  'text-2xl md:text-3xl lg:text-4xl font-semibold my-6 text-[var(--text-primary)]'
                )}
                key={blockKey}
              >
                {content}
              </h3>
            )
            break
          case 'h4':
            nodes.push(
              <h4
                className={applyTopMarginRemoval(
                  'text-xl md:text-2xl lg:text-3xl font-semibold my-5 text-[var(--text-primary)]'
                )}
                key={blockKey}
              >
                {content}
              </h4>
            )
            break
          case 'h5':
            nodes.push(
              <h5
                className={applyTopMarginRemoval(
                  'text-lg md:text-xl lg:text-2xl font-medium my-4 text-[var(--text-primary)]'
                )}
                key={blockKey}
              >
                {content}
              </h5>
            )
            break
          case 'h6':
            nodes.push(
              <h6
                className={applyTopMarginRemoval(
                  'text-base md:text-lg lg:text-xl font-medium my-3 text-[var(--text-primary)]'
                )}
                key={blockKey}
              >
                {content}
              </h6>
            )
            break
          case 'blockquote':
            nodes.push(
              <blockquote
                className={applyTopMarginRemoval(
                  'border-l-4 border-[var(--border-primary)] pl-6 my-8 italic text-xl md:text-2xl text-[var(--text-secondary)] leading-relaxed'
                )}
                key={blockKey}
              >
                {content}
              </blockquote>
            )
            break
          default:
            nodes.push(
              <p
                className={applyTopMarginRemoval('my-4 leading-relaxed text-[var(--text-primary)]')}
                key={blockKey}
              >
                {content}
              </p>
            )
        }
      }
      isFirstNode = false
      continue
    }

    // Handle Custom Objects - R2 portableTextImage (new)
    if (block._type === 'portableTextImage' && block.imageR2?.url) {
      const isSideBySide = block.layout === 'left' || block.layout === 'right'
      const vAlignClass =
        block.verticalAlign === 'center'
          ? 'align-middle self-center !my-auto !order-50'
          : block.verticalAlign === 'bottom'
            ? 'align-bottom !mt-auto !order-last'
            : 'align-top self-start !order-first'

      const layoutClass =
        block.layout === 'left'
          ? `${block.verticalAlign === 'bottom' || block.verticalAlign === 'center' ? 'clear-both' : 'clear-none float-left'} w-[calc(50%-0.5rem)] mr-2 ${block.verticalAlign === 'bottom' ? '!mb-0' : 'mb-4'}`
          : block.layout === 'right'
            ? `${block.verticalAlign === 'bottom' || block.verticalAlign === 'center' ? 'clear-both ml-auto' : 'clear-none float-right'} w-[calc(50%-0.5rem)] ml-2 ${block.verticalAlign === 'bottom' ? '!mb-0' : 'mb-4'}`
            : block.layout === 'center'
              ? `clear-both mx-auto md:w-3/4 ${block.verticalAlign === 'bottom' ? '!mb-0' : 'mb-4'}`
              : `clear-both w-full ${block.verticalAlign === 'bottom' ? '!mb-0' : 'mb-4'}`

      const marginClassForFigure =
        block.verticalAlign === 'bottom' || block.verticalAlign === 'center'
          ? '!mb-0 !pb-0 leading-none'
          : applyTopMarginRemoval('my-2')

      nodes.push(
        <figure key={blockKey} className={`${marginClassForFigure} ${isSideBySide && block.verticalAlign !== 'bottom' && block.verticalAlign !== 'center' ? '' : 'clear-both'} ${vAlignClass} ${layoutClass}`}>
          <OptimizedImage
            src={block.imageR2.url}
            alt={block.alt || block.imageR2.alt || ''}
            className="w-full h-auto shadow-sm cursor-pointer"
            crop={getImageCrop(block)}
            hotspot={getImageHotspot(block)}
            origWidth={getImageOrigWidth(block)}
            origHeight={getImageOrigHeight(block)}
            onClick={() => onMediaClick?.(block.imageR2!.url!)}
          />
          {block.caption && (
            <figcaption className="mt-3 text-sm text-gray-500 text-center italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )
      isFirstNode = false
      continue
    }

    // Handle Custom Objects - Legacy Sanity native image
    if (block._type === 'image' && block.asset) {
      const isSideBySide = block.layout === 'left' || block.layout === 'right'
      const vAlignClass =
        block.verticalAlign === 'center'
          ? 'align-middle self-center !my-auto !order-50'
          : block.verticalAlign === 'bottom'
            ? 'align-bottom !mt-auto !order-last'
            : 'align-top self-start !order-first'

      const layoutClass =
        block.layout === 'left'
          ? `${block.verticalAlign === 'bottom' || block.verticalAlign === 'center' ? 'clear-both' : 'clear-none float-left'} w-[calc(50%-0.5rem)] mr-2 ${block.verticalAlign === 'bottom' ? '!mb-0' : 'mb-4'}`
          : block.layout === 'right'
            ? `${block.verticalAlign === 'bottom' || block.verticalAlign === 'center' ? 'clear-both ml-auto' : 'clear-none float-right'} w-[calc(50%-0.5rem)] ml-2 ${block.verticalAlign === 'bottom' ? '!mb-0' : 'mb-4'}`
            : block.layout === 'center'
              ? `clear-both mx-auto md:w-3/4 ${block.verticalAlign === 'bottom' ? '!mb-0' : 'mb-4'}`
              : `clear-both w-full ${block.verticalAlign === 'bottom' ? '!mb-0' : 'mb-4'}`

      const marginClassForFigure =
        block.verticalAlign === 'bottom' || block.verticalAlign === 'center'
          ? '!mb-0 !pb-0 leading-none'
          : applyTopMarginRemoval('my-2')

      nodes.push(
        <figure key={blockKey} className={`${marginClassForFigure} ${isSideBySide && block.verticalAlign !== 'bottom' && block.verticalAlign !== 'center' ? '' : 'clear-both'} ${vAlignClass} ${layoutClass}`}>
          <OptimizedImage
            src={urlFor(block).url() || ''}
            alt={block.alt || ''}
            className="w-full h-auto shadow-sm cursor-pointer"
            crop={getImageCrop(block)}
            hotspot={getImageHotspot(block)}
            origWidth={getImageOrigWidth(block)}
            origHeight={getImageOrigHeight(block)}
            onClick={() => onMediaClick?.(urlFor(block).url() || '')}
          />
          {block.caption && (
            <figcaption className="mt-3 text-sm text-gray-500 text-center italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )
      isFirstNode = false
    }

    if (block._type === 'youtube' && block.url) {
      const videoId = block.url.match(
        new RegExp(
          '(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([^"&?\\/\\s]{11})'
        )
      )?.[1]
      if (videoId) {
        nodes.push(
          <div key={blockKey} className={applyTopMarginRemoval('my-10')}>
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
        isFirstNode = false
      }
    }

    if (block._type === 'divider') {
      const borderStyle =
        block.style === 'thick'
          ? 'border-t-4'
          : block.style === 'dotted'
            ? 'border-t border-dotted'
            : 'border-t'
      nodes.push(
        <hr
          key={blockKey}
          className={`border-gray-200 ${borderStyle} ${applyTopMarginRemoval('my-12')}`}
        />
      )
      isFirstNode = false
    }

    if (block._type === 'cta' && (block.link || block.url)) {
      const linkUrl = block.link || block.url || '#'
      const alignClass =
        block.align === 'left' || block.layout === 'left'
          ? 'justify-start'
          : block.align === 'right' || block.layout === 'right'
            ? 'justify-end'
            : 'justify-center'

      const isTextOnly = block.style === 'text'
      const btnStyle = isTextOnly
        ? 'inline-block bg-transparent text-[var(--text-primary)] border-none p-0 underline hover:no-underline font-normal text-base transition-opacity duration-300 hover:opacity-70'
        : block.style === 'secondary'
          ? 'inline-flex items-center px-8 py-3.5 text-[9px] md:text-[11px] leading-none uppercase tracking-[0.2em] font-medium font-inter bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all duration-300'
          : block.style === 'outline'
            ? 'inline-flex items-center px-8 py-3.5 text-[9px] md:text-[11px] leading-none uppercase tracking-[0.2em] font-medium font-inter bg-transparent text-[var(--text-primary)] border border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all duration-300'
            : 'inline-flex items-center px-8 py-3.5 text-[9px] md:text-[11px] leading-none uppercase tracking-[0.2em] font-medium font-inter bg-[var(--text-primary)] text-[var(--bg-primary)] border border-[var(--text-primary)] hover:bg-transparent hover:text-[var(--text-primary)] transition-all duration-300'

      const label =
        typeof block.text === 'string'
          ? block.text
          : typeof block.text === 'object' && block.text !== null
            ? (block.text as Record<string, string>)['tr'] ||
              (block.text as Record<string, string>)['en'] ||
              'Devam Et'
            : 'Devam Et'

      const isExternal = linkUrl.startsWith('http://') || linkUrl.startsWith('https://')

      nodes.push(
        <div key={blockKey} className={`flex ${alignClass} ${applyTopMarginRemoval('my-8')}`}>
          <a
            href={linkUrl}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className={btnStyle}
          >
            {label}
          </a>
        </div>
      )
      isFirstNode = false
    }
  }

  flushList()
  return <div className="portable-text-container flex flex-col flex-1 min-h-0 h-full w-full">{nodes}</div>
}
