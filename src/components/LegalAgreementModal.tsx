import React, {useEffect, useState, useCallback} from 'react'
import {useTranslation} from '../i18n'
import {getPreliminaryInfoForm, getDistanceSalesAgreement, getKvkkPolicy} from '../services/cms'
import {useBodyScrollLock} from '../hooks/useBodyScrollLock'
import PortableTextLite from './PortableTextLite'
import type {PreliminaryInfoForm, DistanceSalesAgreement, KvkkPolicy} from '../types'

export type LegalDocType = 'preliminary' | 'distance_sales' | 'kvkk'

interface LegalAgreementModalProps {
  isOpen: boolean
  onClose: () => void
  initialDoc?: LegalDocType
}

type PortableBlock = {
  _type?: string
  [key: string]: unknown
}

export const LegalAgreementModal: React.FC<LegalAgreementModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'preliminary',
}) => {
  const {t, locale} = useTranslation()
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialDoc)
  const [preliminaryDoc, setPreliminaryDoc] = useState<PreliminaryInfoForm | null>(null)
  const [distanceDoc, setDistanceDoc] = useState<DistanceSalesAgreement | null>(null)
  const [kvkkDoc, setKvkkDoc] = useState<KvkkPolicy | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialDoc)
    }
  }, [isOpen, initialDoc])

  const loadDocs = useCallback(async () => {
    setIsLoading(true)
    try {
      const [prelim, dist, kvkk] = await Promise.all([
        getPreliminaryInfoForm(),
        getDistanceSalesAgreement(),
        getKvkkPolicy(),
      ])
      setPreliminaryDoc(prelim)
      setDistanceDoc(dist)
      setKvkkDoc(kvkk)
    } catch {
      // Fallbacks are automatically handled inside service functions
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadDocs()
    }
  }, [isOpen, loadDocs])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getCurrentContent = () => {
    let doc: PreliminaryInfoForm | DistanceSalesAgreement | KvkkPolicy | null = null
    let defaultTitle = ''

    if (activeTab === 'preliminary') {
      doc = preliminaryDoc
      defaultTitle = locale === 'en' ? 'Preliminary Information Form' : 'Ön Bilgilendirme Formu'
    } else if (activeTab === 'distance_sales') {
      doc = distanceDoc
      defaultTitle = locale === 'en' ? 'Distance Sales Agreement' : 'Mesafeli Satış Sözleşmesi'
    } else if (activeTab === 'kvkk') {
      doc = kvkkDoc
      defaultTitle =
        locale === 'en' ? 'Clarification Text on Personal Data' : 'KVKK Aydınlatma Metni'
    }

    const title = doc?.title ? t(doc.title) : defaultTitle
    const localizedContent = doc?.content as Record<string, unknown> | undefined
    const blocks =
      localizedContent?.[locale] ??
      localizedContent?.['tr'] ??
      localizedContent?.['en'] ??
      undefined

    return {title, blocks, updatedAt: doc?.updatedAt}
  }

  const {title, blocks, updatedAt} = getCurrentContent()
  const updatedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'tr-TR')
    : new Date().toLocaleDateString(locale === 'en' ? 'en-GB' : 'tr-TR')

  return (
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-default w-full h-full border-none p-0 focus:outline-none"
        onClick={onClose}
        aria-label={t('close') || 'Kapat'}
        tabIndex={-1}
      />

      {/* Modal Dialog Content */}
      <div
        data-lenis-prevent
        className="relative z-10 w-full max-w-3xl max-h-[85vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col rounded-sm overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 bg-neutral-50 dark:bg-neutral-950/60">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              Birim Mobilya San. ve Tic. A.Ş.
            </span>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer -mr-2"
            aria-label={t('close') || 'Kapat'}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/90 text-xs sm:text-sm font-medium overflow-x-auto overflow-y-hidden scrollbar-none flex-shrink-0 px-3 min-h-[50px]">
          <button
            type="button"
            onClick={() => setActiveTab('preliminary')}
            className={`px-4 py-3.5 whitespace-nowrap transition-all border-b-2 flex items-center justify-center cursor-pointer ${
              activeTab === 'preliminary'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {locale === 'en' ? 'Preliminary Info Form' : 'Ön Bilgilendirme Formu'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('distance_sales')}
            className={`px-4 py-3.5 whitespace-nowrap transition-all border-b-2 flex items-center justify-center cursor-pointer ${
              activeTab === 'distance_sales'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {locale === 'en' ? 'Distance Sales Contract' : 'Mesafeli Satış Sözleşmesi'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kvkk')}
            className={`px-4 py-3.5 whitespace-nowrap transition-all border-b-2 flex items-center justify-center cursor-pointer ${
              activeTab === 'kvkk'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {locale === 'en' ? 'Clarification Text (KVKK)' : 'Aydınlatma Metni (KVKK)'}
          </button>
        </div>

        {/* Content Body */}
        <div
          data-lenis-prevent
          onWheel={e => e.stopPropagation()}
          className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 overscroll-contain"
        >
          {isLoading ? (
            <div className="py-12 flex justify-center items-center text-neutral-400">
              <span className="inline-block animate-spin mr-2">⟳</span>
              {locale === 'en' ? 'Loading legal agreement...' : 'Yasal metin yükleniyor...'}
            </div>
          ) : Array.isArray(blocks) ? (
            <div className="prose prose-sm sm:prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200">
              <PortableTextLite value={blocks as PortableBlock[]} />
              <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
                <span>Birim Mobilya San. ve Tic. A.Ş.</span>
                <span>
                  {locale === 'en' ? 'Last Updated' : 'Son Güncelleme'}: {updatedDate}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500">
              {locale === 'en'
                ? 'Content is currently unavailable.'
                : 'İçerik şu anda görüntülenemiyor.'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-neutral-200 dark:border-neutral-800 px-6 py-3.5 bg-neutral-50 dark:bg-neutral-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            {locale === 'en' ? 'Close & Continue' : 'Kapat ve Devam Et'}
          </button>
        </div>
      </div>
    </div>
  )
}
