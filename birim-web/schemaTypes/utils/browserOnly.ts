import React from 'react'

export function browserOnly<T>(component: T): T | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  return component
}

export function browserOnlyInput<T>(component: T): T | any {
  if (typeof window === 'undefined') {
    return () => React.createElement('div', {}, 'Loading component...')
  }
  return component
}
