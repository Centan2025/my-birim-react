import React from 'react';

type Span = { _type: 'span'; text: string; marks?: string[] };
type Block = { _type: 'block'; style?: string; children?: Span[]; markDefs?: any[]; listItem?: 'bullet' | 'number'; level?: number };

function renderInline(spans: Span[] = [], markDefs: any[] = []) {
  return spans.map((s, i) => {
    let el: React.ReactNode = s.text;
    // marks mapping kept minimal (strong/em emphasis and links)
    if (s.marks && s.marks.length) {
      s.marks.forEach((m) => {
        if (m === 'strong') el = <strong key={i + '-strong'}>{el}</strong>;
        if (m === 'em') el = <em key={i + '-em'}>{el}</em>;
        const def = markDefs.find((d: any) => d?._key === m && d?._type === 'link' && d?.href);
        if (def) {
          el = (
            <a key={i + '-a'} href={def.href} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
              {el}
            </a>
          );
        }
      });
    }
    return <React.Fragment key={i}>{el}</React.Fragment>;
  });
}

export default function PortableTextLite({ value }: { value: Block[] | undefined }) {
  if (!Array.isArray(value) || value.length === 0) return null;

  // Group lists
  const nodes: React.ReactNode[] = [];
  let listBuffer: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    nodes.push(
      listBuffer.type === 'ul' ? <ul className="list-disc pl-6 my-4" key={nodes.length}>{listBuffer.items}</ul>
      : <ol className="list-decimal pl-6 my-4" key={nodes.length}>{listBuffer.items}</ol>
    );
    listBuffer = null;
  };

  value.forEach((block, idx) => {
    if (block.listItem) {
      const type = block.listItem === 'bullet' ? 'ul' : 'ol';
      const item = <li key={idx}>{renderInline(block.children as Span[], block.markDefs || [])}</li>;
      if (!listBuffer || listBuffer.type !== type) {
        flushList();
        listBuffer = { type, items: [item] };
      } else {
        listBuffer.items.push(item);
      }
      return;
    }
    flushList();
    if (block._type === 'block') {
      const style = block.style || 'normal';
      const content = renderInline(block.children as Span[], block.markDefs || []);
      if (style === 'h1') nodes.push(<h1 className="text-3xl font-light my-4" key={idx}>{content}</h1>);
      else if (style === 'h2') nodes.push(<h2 className="text-2xl font-light my-4" key={idx}>{content}</h2>);
      else if (style === 'h3') nodes.push(<h3 className="text-xl font-light my-3" key={idx}>{content}</h3>);
      else nodes.push(<p className="my-3 leading-relaxed" key={idx}>{content}</p>);
      return;
    }
  });
  flushList();
  return <div>{nodes}</div>;
}


