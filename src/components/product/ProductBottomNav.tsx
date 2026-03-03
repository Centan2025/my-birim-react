import React from 'react'
import { Link } from 'react-router-dom'

interface ProductNavProps {
  prevProduct: any | null
  nextProduct: any | null
  show: boolean
}

const MinimalChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const MinimalChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const ProductBottomNav: React.FC<ProductNavProps> = ({ prevProduct, nextProduct, show }) => {
  if (!show || (!prevProduct && !nextProduct)) return null

  return (
    <div className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {prevProduct ? (
              <Link
                to={`/product/${prevProduct.id}`}
                className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Previous product"
              >
                <MinimalChevronLeft className="w-12 h-12 md:w-16 md:h-16" />
              </Link>
            ) : (
              <span />
            )}
          </div>
          <div className="flex-1 text-right">
            {nextProduct ? (
              <Link
                to={`/product/${nextProduct.id}`}
                className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Next product"
              >
                <MinimalChevronRight className="w-12 h-12 md:w-16 md:h-16" />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
