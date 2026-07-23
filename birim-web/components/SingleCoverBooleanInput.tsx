import React, {useCallback} from 'react'
import {BooleanInputProps, set} from 'sanity'
import {Switch, Flex, Text} from '@sanity/ui'

export default function SingleCoverBooleanInput(props: BooleanInputProps) {
  const {value, onChange} = props

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked
      onChange(set(isChecked))
    },
    [onChange],
  )

  return (
    <Flex align="center" gap={3} padding={2}>
      <Switch checked={!!value} onChange={handleChange} />
      <Text size={1} weight={value ? 'bold' : 'regular'}>
        {value ? '⭐ Evet (Kapak Görseli)' : 'Hayır (Standart Görsel)'}
      </Text>
    </Flex>
  )
}
