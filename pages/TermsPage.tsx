import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTermsOfService } from '../services/cms';
import { useTranslation } from '../i18n';
import PortableTextLite from '../components/PortableTextLite';
import type { TermsOfService } from '../types';

export default function TermsPage() {
  const [policy, setPolicy] = useState<TermsOfService | null>(null);
  const { t, locale } = useTranslation();

  useEffect(() => {
    getTermsOfService().then(setPolicy).catch(() => setPolicy(null));
  }, []);

  const title = policy?.title ? t(policy.title) : 'Kullanım Şartları';
  const contentBlocks = policy?.content
    ? ((policy.content as any)[locale] || (policy.content as any).tr || (policy.content as any).en)
    : undefined;
  const updated = policy?.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-8 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex items-center">
            <li><Link to="/" className="hover:text-gray-800">Ana Sayfa</Link></li>
            <li className="mx-2 font-light text-gray-400">|</li>
            <li className="font-light text-gray-500" aria-current="page">{title}</li>
          </ol>
        </nav>
        <h1 className="text-3xl font-light text-gray-800 mb-6">{title}</h1>
        {Array.isArray(contentBlocks) ? (
          <div className="prose prose-gray max-w-none">
            <PortableTextLite value={contentBlocks as any[]} />
            <p className="text-sm text-gray-500 mt-6">Son güncelleme: {updated}</p>
          </div>
        ) : (
          <div className="text-gray-500">
            İçerik henüz eklenmemiş. Lütfen Sanity CMS'te "Kullanım Şartları" belgesini oluşturup
            başlık ve içeriği girin.
          </div>
        )}
      </div>
    </div>
  );
}

