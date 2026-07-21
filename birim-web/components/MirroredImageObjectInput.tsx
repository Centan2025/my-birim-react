import React from 'react'
import {ObjectInputProps} from 'sanity'

export default function MirroredImageObjectInput(props: ObjectInputProps) {
  return props.renderDefault(props)
}
