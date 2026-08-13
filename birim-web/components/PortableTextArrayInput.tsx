import {useCallback, useEffect} from 'react'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {set} from 'sanity'

const FONT_SIZE_MARKS = [
  'size-12px',
  'size-14px',
  'size-16px',
  'size-18px',
  'size-24px',
  'size-32px',
  'size-48px',
]

const isFontSizeMark = (m: string) =>
  FONT_SIZE_MARKS.includes(m) || m.startsWith('size-') || m.startsWith('font-size-')

function cleanMarksArray(marks: string[]): string[] {
  if (!Array.isArray(marks) || marks.length <= 1) return marks
  const fontMarks = marks.filter(isFontSizeMark)
  if (fontMarks.length <= 1) return marks

  // Keep only the last font size mark added
  const lastFontMark = fontMarks[fontMarks.length - 1]
  return marks.filter((m) => !isFontSizeMark(m) || m === lastFontMark)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanValue(val: any): any {
  if (!val) return val
  if (Array.isArray(val)) {
    let changed = false
    const newArr = val.map((item) => {
      const cleaned = cleanValue(item)
      if (cleaned !== item) changed = true
      return cleaned
    })
    return changed ? newArr : val
  }

  if (typeof val === 'object') {
    if (val._type === 'span' && Array.isArray(val.marks)) {
      const cleanedMarks = cleanMarksArray(val.marks)
      if (cleanedMarks !== val.marks) {
        return {...val, marks: cleanedMarks}
      }
    }

    if (val._type === 'block' && Array.isArray(val.children)) {
      let changed = false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newChildren = val.children.map((child: any) => {
        const cleanedChild = cleanValue(child)
        if (cleanedChild !== child) changed = true
        return cleanedChild
      })
      if (changed) {
        return {...val, children: newChildren}
      }
    }
  }

  return val
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanPatch(patch: any): any {
  if (!patch) return patch

  // Case 1: Patch targets 'marks' path directly (e.g. set(['size-12px', 'size-14px'], [0, 'children', 0, 'marks']))
  if (Array.isArray(patch.path) && patch.path[patch.path.length - 1] === 'marks') {
    if (patch.type === 'set' && Array.isArray(patch.value)) {
      const cleanedMarks = cleanMarksArray(patch.value)
      if (cleanedMarks !== patch.value) {
        return {...patch, value: cleanedMarks}
      }
    }
  }

  // Case 2: Patch contains value object or array
  if (patch.value) {
    const cleanedValue = cleanValue(patch.value)
    if (cleanedValue !== patch.value) {
      return {...patch, value: cleanedValue}
    }
  }

  return patch
}

export default function PortableTextArrayInput(props: ArrayOfObjectsInputProps) {
  const {value, onChange, renderDefault} = props

  // Initial cleanup of pre-existing documents with stacked font-size marks
  useEffect(() => {
    if (!Array.isArray(value) || value.length === 0) return
    const cleaned = cleanValue(value)
    if (cleaned !== value) {
      const timer = setTimeout(() => {
        onChange(set(cleaned))
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [value, onChange])

  // Intercept all patches emitted by Sanity Portable Text Editor
  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      if (!event) {
        onChange(event)
        return
      }

      if ('patches' in event && Array.isArray(event.patches)) {
        const cleanedPatches = event.patches.map(cleanPatch)
        onChange({
          ...event,
          patches: cleanedPatches,
        })
        return
      }

      if (Array.isArray(event)) {
        const cleaned = event.map(cleanPatch)
        onChange(cleaned)
        return
      }

      onChange(cleanPatch(event))
    },
    [onChange],
  )

  return renderDefault({
    ...props,
    onChange: handleChange,
  })
}
