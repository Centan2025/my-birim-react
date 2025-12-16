import React from 'react'
import {Link} from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({items, className = ''}) => {
  if (!items || items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center text-[11px] sm:text-[12px] text-gray-700 gap-1 sm:gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isFirst = index === 0
          const label = typeof item.label === 'string' && isFirst ? item.label.toUpperCase() : item.label
          return (
            <li key={index} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="underline underline-offset-2 text-gray-900 hover:text-gray-900 transition-colors"
                >
                  {label}
                </Link>
              ) : (
                <span className={isLast ? 'text-gray-900' : 'text-gray-800'}>
                  {label}
                </span>
              )}
              {!isLast && <span className="text-gray-400 mx-0.5 sm:mx-1">|</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}


