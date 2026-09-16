import React from 'react'

export const ReactCrop = ({children}: {children?: React.ReactNode}) =>
  React.createElement('div', null, children)
export const centerCrop = (crop: unknown) => crop
export const makeAspectCrop = (crop: unknown) => crop
export default ReactCrop
