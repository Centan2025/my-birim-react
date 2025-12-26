import React from 'react'
import { sanitizeText, sanitizeUrl } from '../lib/sanitize'

type Span = { _type: 'span'; text: string; marks?: string[] }
type MarkDef = { _key?: string; _type?: string; href?: string }
type Block = {
  _type?: string
  style?: string
  children?: Span[]
  markDefs?: MarkDef[]
  listItem?: 'bullet' | 'number'
  level?: number
  _key?: string
}

function renderInline(spans: Span[] = [], markDefs: MarkDef[] = []) {
  return spans.map((s, i) => {
    // Sanitize text content to prevent XSS
    const sanitizedText = sanitizeText(s.text)
    let el: React.ReactNode = sanitizedText
    // marks mapping kept minimal (strong/em emphasis and links)
    if (s.marks && s.marks.length) {
      s.marks.forEach(m => {
        if (m === 'strong') el = <strong key={i + '-strong'}>{el}</strong>
        if (m === 'em') el = <em key={i + '-em'}>{el}</em>
        const def = markDefs.find(d => d?._key === m && d?._type === 'link' && d?.href)
        if (def) {
          // Sanitize URL to prevent XSS
          const sanitizedHref = sanitizeUrl(def.href || '')
          if (sanitizedHref) {
            el = (
              <a
                key={i + '-a'}
                href={sanitizedHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                {el}
              </a>
            )
          }
        }
      })
    }
    return <React.Fragment key={i}>{el}</React.Fragment>
  })
}

export default function PortableTextLite({ value }: { value: Block[] | undefined }) {
  if (!Array.isArray(value) || value.length === 0) return null

  // Group lists
  const nodes: React.ReactNode[] = []
  let listBuffer: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null

  let listCounter = 0
  const flushList = () => {
    if (!listBuffer) return
    const listKey = `list-${listCounter++}`
    nodes.push(
      listBuffer.type === 'ul' ? (
        <ul className="list-disc pl-6 my-4" key={listKey}>
          {listBuffer.items}
        </ul>
      ) : (
        <ol className="list-decimal pl-6 my-4" key={listKey}>
          {listBuffer.items}
        </ol>
      )
    )
    listBuffer = null
  }

  value.forEach((block, idx) => {
    // Benzersiz key oluştur: block._key varsa onu kullan, yoksa idx ile prefix ekle
    const blockKey = block._key || `block-${idx}`

    if (block.listItem) {
      const type = block.listItem === 'bullet' ? 'ul' : 'ol'
      const item = (
        <li key={blockKey}>{renderInline(block.children as Span[], block.markDefs || [])}</li>
      )
      if (!listBuffer || listBuffer.type !== type) {
        flushList()
        listBuffer = { type, items: [item] }
      } else {
        listBuffer.items.push(item)
      }
      return
    }
    flushList()
    if (block._type === 'block') {
      const style = block.style || 'normal'
      const content = renderInline(block.children as Span[], block.markDefs || [])
      if (style === 'h1')
        nodes.push(
          <h1 className="text-4xl md:text-5xl lg:text-6xl my-8 leading-tight" key={blockKey}>
            {content}
          </h1>
        )
      else if (style === 'h2')
        nodes.push(
          <h2 className="text-3xl md:text-4xl lg:text-5xl my-6 leading-snug" key={blockKey}>
            {content}
          </h2>
        )
      else if (style === 'h3')
        nodes.push(
          <h3 className="text-2xl md:text-3xl lg:text-4xl my-5" key={blockKey}>
            {content}
          </h3>
        )
      else if (style === 'h4')
        nodes.push(
          <h4 className="text-xl md:text-2xl lg:text-3xl my-4" key={blockKey}>
            {content}
          </h4>
        )
      else if (style === 'h5')
        nodes.push(
          <h5 className="text-lg md:text-xl lg:text-2xl my-3" key={blockKey}>
            {content}
          </h5>
        )
      else if (style === 'h6')
        nodes.push(
          <h6 className="text-base md:text-lg lg:text-xl my-2 font-medium" key={blockKey}>
            {content}
          </h6>
        )
      else
        nodes.push(
          <p className="my-3 leading-relaxed" key={blockKey}>
            {content}
          </p>
        )
      return
    }
  })
  flushList()
  return <div>{nodes}</div>
}
