import React from 'react'

export const ArrowRight = (props: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    style={{...props.style, display: 'block', margin: '0 auto'}}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <path d="M10 8l4 4-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
