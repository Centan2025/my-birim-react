import React, {useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {MemberField} from 'sanity'
import {Flex, Box, Button} from '@sanity/ui'
import {
  SUPPORTED_LANGUAGES,
  ALL_LANGUAGES_OPTION,
  useStudioLanguage,
} from '../utils/studioLanguageStore'

export default function LocalizedPortableTextInput(props: ObjectInputProps) {
  const {value, members} = props

  const globalLang = useStudioLanguage()
  const [localLang, setLocalLang] = useState<string | null>(null)

  const effectiveLang = localLang || globalLang

  const activeMember = members.find((m) => m.kind === 'field' && m.name === effectiveLang)

  return (
    <Box paddingY={1}>
      {/* Erişilebilirlik label fix */}
      <input
        type="text"
        id={props.id}
        name={props.id}
        autoComplete="off"
        readOnly
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        }}
      />

      {/* Dil Sekmeleri */}
      <Flex
        align="center"
        justify="space-between"
        gap={2}
        style={{
          marginBottom: '8px',
          flexWrap: 'wrap',
          background: 'rgba(128, 128, 128, 0.07)',
          padding: '4px 6px',
          borderRadius: '8px',
          border: '1px solid rgba(128, 128, 128, 0.15)',
        }}
      >
        <Flex align="center" gap={1} style={{flexWrap: 'wrap'}}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = effectiveLang === lang.id
            const fieldVal = value && value[lang.id]
            const hasValue = Array.isArray(fieldVal)
              ? fieldVal.length > 0
              : Boolean(fieldVal && String(fieldVal).trim() !== '')

            return (
              <Button
                key={lang.id}
                size={0}
                mode={isSelected ? 'default' : 'ghost'}
                tone={isSelected ? 'primary' : 'default'}
                onClick={() => setLocalLang(lang.id === localLang ? null : lang.id)}
                title={`${lang.title} (${hasValue ? 'Dolu' : 'Boş'})`}
                style={{
                  padding: '3px 7px',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '11px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                <Flex align="center" gap={1}>
                  <span>
                    {lang.flag} {lang.shortLabel}
                  </span>
                  {hasValue && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#fff' : '#10B981',
                      }}
                    />
                  )}
                </Flex>
              </Button>
            )
          })}

          <div
            style={{
              width: '1px',
              height: '14px',
              backgroundColor: 'rgba(128, 128, 128, 0.25)',
              margin: '0 2px',
            }}
          />

          <Button
            size={0}
            mode={effectiveLang === 'all' ? 'default' : 'ghost'}
            tone={effectiveLang === 'all' ? 'primary' : 'default'}
            onClick={() => setLocalLang(effectiveLang === 'all' ? null : 'all')}
            title="Tüm dilleri alt alta göster"
            style={{
              padding: '3px 7px',
              fontWeight: effectiveLang === 'all' ? 600 : 400,
              fontSize: '11px',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            🌐 {ALL_LANGUAGES_OPTION.shortLabel}
          </Button>
        </Flex>
      </Flex>

      {/* Rich Text Editörleri */}
      {effectiveLang === 'all' ? (
        <Box>
          {members.map((member) => {
            if (member.kind === 'field') {
              return (
                <Box key={member.key} marginBottom={3}>
                  <MemberField
                    member={member}
                    renderAnnotation={props.renderAnnotation}
                    renderBlock={props.renderBlock}
                    renderField={props.renderField}
                    renderInlineBlock={props.renderInlineBlock}
                    renderInput={props.renderInput}
                    renderItem={props.renderItem}
                    renderPreview={props.renderPreview}
                  />
                </Box>
              )
            }
            return null
          })}
        </Box>
      ) : activeMember && activeMember.kind === 'field' ? (
        <Box>
          <MemberField
            member={activeMember}
            renderAnnotation={props.renderAnnotation}
            renderBlock={props.renderBlock}
            renderField={props.renderField}
            renderInlineBlock={props.renderInlineBlock}
            renderInput={props.renderInput}
            renderItem={props.renderItem}
            renderPreview={props.renderPreview}
          />
        </Box>
      ) : (
        props.renderDefault(props)
      )}
    </Box>
  )
}
