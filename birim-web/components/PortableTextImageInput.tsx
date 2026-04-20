import React, {useCallback} from 'react'
import {ObjectInputProps, set, PatchEvent} from 'sanity'

const LAYOUT_OPTIONS = [
  {value: 'full', label: 'Tam', icon: '▬'},
  {value: 'center', label: 'Merkez', icon: '◼'},
  {value: 'left', label: 'Sol', icon: '◧'},
  {value: 'right', label: 'Sağ', icon: '◨'},
]

export default function PortableTextImageInput(props: ObjectInputProps) {
  const {value, onChange, renderDefault} = props
  const currentLayout = (value as any)?.layout || 'full'

  const handleLayoutChange = useCallback(
    (newLayout: string) => {
      onChange(PatchEvent.from(set(newLayout, ['layout'])))
    },
    [onChange],
  )

  return (
    <div>
      {/* Yerleşim İkonları */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px',
          backgroundColor: '#1a1a2e',
          borderRadius: '6px 6px 0 0',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: '#9ca3af',
            marginRight: '8px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Yerleşim:
        </span>
        {LAYOUT_OPTIONS.map((opt) => {
          const isActive = currentLayout === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              onClick={() => handleLayoutChange(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '28px',
                fontSize: '16px',
                border: isActive ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                backgroundColor: isActive ? 'rgba(96,165,250,0.15)' : 'transparent',
                color: isActive ? '#93c5fd' : '#9ca3af',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.icon}
            </button>
          )
        })}
        {currentLayout !== 'full' && (
          <span
            style={{
              fontSize: '10px',
              color: currentLayout === 'left' || currentLayout === 'right' ? '#34d399' : '#60a5fa',
              marginLeft: '8px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            {LAYOUT_OPTIONS.find((o) => o.value === currentLayout)?.label}
          </span>
        )}
      </div>

      {/* Varsayılan Sanity Girdi Alanı */}
      {renderDefault(props)}
    </div>
  )
}
