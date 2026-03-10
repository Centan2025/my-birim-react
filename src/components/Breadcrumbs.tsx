import React from 'react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="list-none p-0 inline-flex flex-wrap items-center font-inter text-[11px] sm:text-[13px] text-[var(--text-secondary)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const label =
            typeof item.label === 'string' ? item.label.toLocaleUpperCase('tr-TR') : item.label
          return (
            <li key={index} className="flex items-center">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="font-light text-[var(--text-primary)] hover:opacity-80 transition-colors"
                >
                  {label}
                </Link>
              ) : (
                <span className="font-bold text-[var(--text-primary)]">{label}</span>
              )}
              {!isLast && <span className="font-light text-gray-400 mx-2">|</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
