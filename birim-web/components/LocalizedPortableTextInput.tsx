import React, {useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {set, MemberField} from 'sanity'
import {
  Flex,
  Box,
  Button,
  MenuButton,
  Menu,
  MenuItem,
  MenuDivider,
  useToast,
  Spinner,
} from '@sanity/ui'
import {
  SUPPORTED_LANGUAGES,
  ALL_LANGUAGES_OPTION,
  useStudioLanguage,
} from '../utils/studioLanguageStore'
import {translatePortableText} from '../utils/translate'

const hasTextContent = (val: unknown): boolean => {
  if (!val) return false
  if (typeof val === 'string') return val.trim().length > 0
  if (Array.isArray(val)) {
    return val.some((block) => {
      if (block && block._type === 'block' && Array.isArray(block.children)) {
        return block.children.some(
          (child: {text?: unknown}) => typeof child?.text === 'string' && child.text.trim().length > 0,
        )
      }
      return Boolean(block)
    })
  }
  return false
}

export default function LocalizedPortableTextInput(props: ObjectInputProps) {
  const {value, onChange, members} = props
  const toast = useToast()

  const globalLang = useStudioLanguage()
  const [localLang, setLocalLang] = useState<string | null>(null)
  const [translating, setTranslating] = useState<string | null>(null)

  const effectiveLang = localLang || globalLang
  const trValue = value && value['tr']
  const hasTrValue = hasTextContent(trValue)

  const handleTranslate = async (targetLang: string) => {
    if (!hasTrValue) {
      toast.push({
        status: 'warning',
        title: 'Önce Türkçe metni girin',
      })
      return
    }

    setTranslating(targetLang)
    try {
      const translated = await translatePortableText(trValue, targetLang)
      const currentValue = typeof value === 'object' && value !== null ? value : {}
      onChange(set({...currentValue, _type: 'localizedPortableText', [targetLang]: translated}))

      const langInfo = SUPPORTED_LANGUAGES.find((l) => l.id === targetLang)
      toast.push({
        status: 'success',
        title: `${langInfo ? langInfo.title : targetLang} çevirisi tamamlandı`,
      })
    } catch (error: any) {
      toast.push({
        status: 'error',
        title: 'Çeviri hatası',
        description: error.message || 'Çeviri yapılamadı',
      })
    } finally {
      setTranslating(null)
    }
  }

  const handleTranslateAllMissing = async () => {
    if (!hasTrValue) {
      toast.push({
        status: 'warning',
        title: 'Önce Türkçe metni girin',
      })
      return
    }

    const missingLangs = SUPPORTED_LANGUAGES.filter(
      (lang) => lang.id !== 'tr' && (!value || !hasTextContent(value[lang.id])),
    )

    if (missingLangs.length === 0) {
      toast.push({
        status: 'info',
        title: 'Tüm diller zaten dolu',
      })
      return
    }

    setTranslating('all')
    try {
      const newTranslations: Record<string, any> = {}
      for (const lang of missingLangs) {
        try {
          const res = await translatePortableText(trValue, lang.id)
          newTranslations[lang.id] = res
        } catch (e) {
          console.error(`Çeviri başarısız: ${lang.id}`, e)
        }
      }

      const currentValue = typeof value === 'object' && value !== null ? value : {}
      onChange(set({...currentValue, _type: 'localizedPortableText', ...newTranslations}))

      toast.push({
        status: 'success',
        title: `${Object.keys(newTranslations).length} dil otomatik çevrildi`,
      })
    } catch (error: any) {
      toast.push({
        status: 'error',
        title: 'Toplu çeviri hatası',
        description: error.message || 'Çeviri yapılamadı',
      })
    } finally {
      setTranslating(null)
    }
  }

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

      {/* Dil Sekmeleri ve Çeviri Menüsü */}
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
            const hasValue = hasTextContent(fieldVal)

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

        {/* Zarif Çeviri Menüsü */}
        <Flex align="center" gap={1}>
          <MenuButton
            id={`translate-menu-${props.id}`}
            button={
              <Button
                size={0}
                mode="ghost"
                tone={hasTrValue ? 'primary' : 'default'}
                disabled={Boolean(translating) || !hasTrValue}
                title={
                  hasTrValue
                    ? 'Türkçe metinden diğer dillere çevir'
                    : 'Çeviri için önce Türkçe metin girin'
                }
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderRadius: '5px',
                  cursor: hasTrValue ? 'pointer' : 'not-allowed',
                }}
              >
                <Flex align="center" gap={1}>
                  {translating ? <Spinner size={1} /> : <span>🪄</span>}
                  <span>{translating ? 'Çevriliyor...' : 'Çevir ▾'}</span>
                </Flex>
              </Button>
            }
            menu={
              <Menu>
                {SUPPORTED_LANGUAGES.filter((l) => l.id !== 'tr').map((l) => (
                  <MenuItem
                    key={l.id}
                    fontSize={1}
                    padding={2}
                    text={`${l.flag} ${l.title}'ye Çevir`}
                    onClick={() => handleTranslate(l.id)}
                    disabled={!hasTrValue || Boolean(translating)}
                  />
                ))}
                <MenuDivider />
                <MenuItem
                  fontSize={1}
                  padding={2}
                  text="⚡ Tüm Boş Dillere Çevir"
                  onClick={handleTranslateAllMissing}
                  disabled={!hasTrValue || Boolean(translating)}
                />
              </Menu>
            }
            popover={{portal: true, placement: 'bottom-end'}}
          />
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
