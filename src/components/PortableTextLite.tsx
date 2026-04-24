import {ReactNode, Fragment} from 'react'
import {sanitizeText, sanitizeUrl} from '../lib/sanitize'
import {OptimizedImage} from './OptimizedImage'
import {urlFor} from '../lib/imageUrl'

type Span = {_type: 'span'; text: string; marks?: string[]}
type MarkDef = {
  _key?: string
  _type?: string
  href?: string
  blank?: boolean
  reference?: {_ref: string; _type: string}
  color?: string
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
  url?: string
  style_type?: string // for divider or cta
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
}: {
  value: Block[] | undefined
  removeTopMargin?: boolean
  onMediaClick?: (url: string) => void
}) {
  if (!Array.isArray(value) || value.length === 0) return null

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

  for (let idx = 0; idx < value.length; idx++) {
    const block = value[idx]
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

    // R2 görselleri için crop ve hotspot bilgisini çıkar
    const getImageCrop = (b: Block) => {
      const r2 = b.imageR2
      if (
        r2 &&
        r2.cropWidth &&
        r2.cropHeight &&
        (r2.cropWidth < 0.999 ||
          r2.cropHeight < 0.999 ||
          (r2.cropX && r2.cropX > 0.001) ||
          (r2.cropY && r2.cropY > 0.001))
      ) {
        return {x: r2.cropX || 0, y: r2.cropY || 0, width: r2.cropWidth, height: r2.cropHeight}
      }
      return undefined
    }
    const getImageHotspot = (b: Block) => {
      const r2 = b.imageR2
      if (r2 && r2.hotspotX !== undefined && r2.hotspotY !== undefined) {
        return {x: r2.hotspotX, y: r2.hotspotY}
      }
      return undefined
    }

    if (isImageBlock(block) && (block.layout === 'left' || block.layout === 'right')) {
      let nextValidIndex = idx + 1
      let nextBlock = value[nextValidIndex]

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
        nextBlock = value[nextValidIndex]
      }

      if (
        nextBlock &&
        isImageBlock(nextBlock) &&
        (nextBlock.layout === 'left' || nextBlock.layout === 'right') &&
        nextBlock.layout !== block.layout
      ) {
        // PAIR DETECTED — eşit yükseklik için aspect-ratio container + object-cover
        nodes.push(
          <div
            key={`pair-${blockKey}`}
            className={`grid grid-cols-2 gap-2 my-2 clear-both items-start ${applyTopMarginRemoval('')}`}
          >
            <figure className="flex flex-col">
              <div className="relative w-full overflow-hidden">
                <OptimizedImage
                  src={getImageSrc(block)}
                  alt={getImageAlt(block)}
                  className="w-full h-auto shadow-sm cursor-pointer"
                  crop={getImageCrop(block)}
                  hotspot={getImageHotspot(block)}
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
      isFirstNode = false
      continue
    }

    // Handle Custom Objects - R2 portableTextImage (new)
    if (block._type === 'portableTextImage' && block.imageR2?.url) {
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
            src={block.imageR2.url}
            alt={block.alt || block.imageR2.alt || ''}
            className="w-full h-auto shadow-sm cursor-pointer"
            crop={getImageCrop(block)}
            hotspot={getImageHotspot(block)}
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
            src={urlFor(block).url() || ''}
            alt={block.alt || ''}
            className="w-full h-auto shadow-sm cursor-pointer"
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

    if (block._type === 'cta' && block.link) {
      // Simple CTA Button
      const btnStyle =
        block.style === 'secondary'
          ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--text-primary)] hover:opacity-80'
          : block.style === 'outline'
            ? 'bg-transparent text-[var(--text-primary)] border border-[var(--border-primary)] hover:border-[var(--text-primary)]'
            : 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-80'

      const label =
        typeof block.text === 'string' ? block.text : block.text?.tr || block.text?.en || 'Devam Et'

      nodes.push(
        <div key={blockKey} className={`flex justify-center ${applyTopMarginRemoval('my-8')}`}>
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
      isFirstNode = false
    }
  }

  flushList()
  return <div className="portable-text-container">{nodes}</div>
}
