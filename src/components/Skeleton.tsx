import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  borderRadius?: string | number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  borderRadius = '0px',
}) => {
  const style: React.CSSProperties = {
    width: width !== undefined ? width : '100%',
    height: height !== undefined ? height : '100%',
    borderRadius: borderRadius,
  }

  return (
    <div
      className={`animate-pulse bg-neutral-200 dark:bg-neutral-800 ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-3">
      <Skeleton height="320px" borderRadius="0px" />
      <Skeleton height="20px" width="60%" />
      <Skeleton height="14px" width="40%" />
    </div>
  )
}

export const ProductGridSkeleton: React.FC<{count?: number}> = ({count = 6}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
      {Array.from({length: count}).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}
