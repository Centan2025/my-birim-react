import React from 'react'
import {Flex, Button, Text, Card} from '@sanity/ui'
import {
  SUPPORTED_LANGUAGES,
  ALL_LANGUAGES_OPTION,
  useStudioLanguage,
  setStudioLanguage,
} from '../utils/studioLanguageStore'

interface StudioLanguageBarProps {
  size?: 'small' | 'medium'
  showAllOption?: boolean
  showLabel?: boolean
}

export default function StudioLanguageBar({
  size = 'small',
  showAllOption = true,
  showLabel = true,
}: StudioLanguageBarProps) {
  const currentLang = useStudioLanguage()
  const isSmall = size === 'small'

  return (
    <Flex align="center" gap={1} style={{flexWrap: 'wrap'}}>
      {showLabel && (
        <Text size={isSmall ? 1 : 2} weight="semibold" style={{marginRight: '4px', opacity: 0.8}}>
          🌐 Dil:
        </Text>
      )}

      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = currentLang === lang.id
        return (
          <Button
            key={lang.id}
            size={isSmall ? 1 : 2}
            mode={isActive ? 'default' : 'ghost'}
            tone={isActive ? 'primary' : 'default'}
            onClick={() => setStudioLanguage(lang.id)}
            text={`${lang.flag} ${lang.shortLabel}`}
            title={`${lang.title} (${lang.shortLabel})`}
            style={{
              padding: isSmall ? '3px 8px' : '6px 12px',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              borderRadius: '6px',
            }}
          />
        )
      })}

      {showAllOption && (
        <>
          <div
            style={{
              width: '1px',
              height: isSmall ? '16px' : '20px',
              background: 'var(--card-border-color, #e0e0e0)',
              margin: '0 4px',
            }}
          />
          <Button
            key={ALL_LANGUAGES_OPTION.id}
            size={isSmall ? 1 : 2}
            mode={currentLang === ALL_LANGUAGES_OPTION.id ? 'default' : 'ghost'}
            tone={currentLang === ALL_LANGUAGES_OPTION.id ? 'primary' : 'default'}
            onClick={() => setStudioLanguage(ALL_LANGUAGES_OPTION.id)}
            text={`${ALL_LANGUAGES_OPTION.flag} ${ALL_LANGUAGES_OPTION.shortLabel}`}
            title="Tüm dilleri alt alta göster"
            style={{
              padding: isSmall ? '3px 8px' : '6px 12px',
              fontWeight: currentLang === ALL_LANGUAGES_OPTION.id ? 600 : 400,
              cursor: 'pointer',
              borderRadius: '6px',
            }}
          />
        </>
      )}
    </Flex>
  )
}
