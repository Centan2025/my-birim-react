import {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import {getCookiesPolicy} from '../services/cms'
import {useTranslation} from '../i18n'
import PortableTextLite from '../components/PortableTextLite'
import type {CookiesPolicy} from '../types'
import {useSEO} from '../hooks/useSEO'

type PortableBlock = {
  _type?: string
  [key: string]: unknown
}

export default function CookiesPage() {
  const [policy, setPolicy] = useState<CookiesPolicy | null>(null)
  const {t, locale} = useTranslation()
  const title = policy?.title ? t(policy.title) : 'Çerez Politikası'
  const localizedContent = policy?.content as Record<string, unknown> | undefined
  const contentBlocks =
    localizedContent?.[locale] ??
    localizedContent?.tr ??
    localizedContent?.en ??
    undefined

  useSEO({
    title: `BIRIM - ${title}`,
    description:
      t('cookies_description') ||
      'Çerez politikamız ve kullanıcı verilerinin nasıl işlendiğine dair bilgiler.',
    siteName: 'BIRIM',
    type: 'website',
    locale: 'tr_TR',
  })

  useEffect(() => {
    getCookiesPolicy()
      .then(setPolicy)
      .catch(() => setPolicy(null))
  }, [])

  const updated = policy?.updatedAt
    ? new Date(policy.updatedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'tr-TR')
    : new Date().toLocaleDateString(locale === 'en' ? 'en-GB' : 'tr-TR')

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 lg:pt-24 pb-16">
        <nav className="mb-6 text-sm text-gray-700" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex items-center">
            <li>
              <Link
                to="/"
                className="underline underline-offset-2 text-gray-900 hover:text-gray-900 transition-colors"
              >
                ANASAYFA
              </Link>
            </li>
            <li className="mx-2 font-light text-gray-400">|</li>
            <li className="font-light text-gray-500" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>
        <h1 className="text-3xl font-light text-gray-800 mt-6 md:mt-8 mb-6">{title}</h1>
        {Array.isArray(contentBlocks) ? (
          <div className="prose prose-gray max-w-none">
            <PortableTextLite value={contentBlocks as PortableBlock[]} />
            <p className="text-sm text-gray-500 mt-6">
              {locale === 'en' ? 'Last updated' : 'Son güncelleme'}: {updated}
            </p>
          </div>
        ) : (
          <div className="text-gray-500">
            İçerik henüz eklenmemiş. Lütfen Sanity CMS’te “Çerez Politikası” belgesini oluşturup
            başlık ve içeriği girin.
          </div>
        )}
      </div>
    </div>
  )
}
