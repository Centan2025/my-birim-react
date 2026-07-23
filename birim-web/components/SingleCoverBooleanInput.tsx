import React, {useCallback} from 'react'
import {BooleanInputProps, PatchEvent, set, useFormValue} from 'sanity'
import {Switch, Flex, Text} from '@sanity/ui'

export default function SingleCoverBooleanInput(props: BooleanInputProps) {
  const {value, onChange, path} = props
  const document = useFormValue([]) as Record<string, any> | undefined

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked

      if (!isChecked) {
        onChange(set(false))
        return
      }

      // Path format: ['media', {_key: '...'}, 'isCover'] or ['media', index, 'isCover']
      const arrayFieldName = (path[0] as string) || 'media'
      const itemIdentifier = path[1]

      const arrayItems = (document?.[arrayFieldName] as any[]) || []
      const patches: any[] = []

      arrayItems.forEach((item, idx) => {
        const itemKey = item?._key
        const isCurrentItem =
          itemIdentifier && typeof itemIdentifier === 'object' && '_key' in itemIdentifier
            ? itemKey === (itemIdentifier as any)._key
            : idx === itemIdentifier

        const itemPathSegment = itemKey ? {_key: itemKey} : idx

        if (isCurrentItem) {
          patches.push(set(true, [arrayFieldName, itemPathSegment, 'isCover']))
        } else if (item?.isCover) {
          patches.push(set(false, [arrayFieldName, itemPathSegment, 'isCover']))
        }
      })

      if (patches.length > 0) {
        onChange(PatchEvent.from(patches))
      } else {
        onChange(set(true))
      }
    },
    [onChange, path, document],
  )

  return (
    <Flex align="center" gap={3} padding={2}>
      <Switch checked={!!value} onChange={handleChange} />
      <Text size={1} weight={value ? 'bold' : 'regular'}>
        {value ? '⭐ Evet (Ana Kapak Görseli)' : 'Hayır'}
      </Text>
    </Flex>
  )
}
