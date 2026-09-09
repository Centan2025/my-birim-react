import type {StructureBuilder} from 'sanity/structure'
import type {ConfigContext} from 'sanity'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {PreviewView} from './components/PreviewView'
import {AnalyticsStudioView} from './components/AnalyticsStudioView'
import {SupabaseUsersStudioView} from './components/SupabaseUsersStudioView'

export const deskStructure = (S: StructureBuilder, context: ConfigContext) => {
  return S.list()
    .title('İçerik')
    .items([
      S.listItem()
        .title('Site Analitiği')
        .icon(() => '📊')
        .child(S.component(AnalyticsStudioView).title('Google Analytics Raporu')),
      S.listItem()
        .title('Üyeler & Mimarlar (Supabase)')
        .icon(() => '👥')
        .child(S.component(SupabaseUsersStudioView).title('Üye & Mimar Yönetimi')),
      S.divider(),
      S.listItem()
        .title('Site Ayarları')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .views([
              S.view.form().title('Düzenle'),
              S.view
                .component(PreviewView)
                .title('Önizleme')
                .icon(() => '👁️'),
            ]),
        ),
      S.listItem().title('UI Çevirileri').child(S.document().schemaType('uiTranslations')),
      S.listItem()
        .title('Ana Sayfa')
        .child(
          S.document()
            .schemaType('homePage')
            .documentId('homePage')
            .views([
              S.view.form().title('Düzenle'),
              S.view
                .component(PreviewView)
                .title('Önizleme')
                .icon(() => '👁️'),
            ]),
        ),
      orderableDocumentListDeskItem({
        type: 'category',
        title: 'Kategoriler & Modeller',
        S,
        context,
        icon: () => '🪑',
      }),
      S.documentTypeListItem('product').title('Tüm Modeller'),
      orderableDocumentListDeskItem({
        type: 'designer',
        title: 'Tasarımcılar',
        S,
        context,
        icon: () => '🎨',
      }),
      orderableDocumentListDeskItem({
        type: 'project',
        title: 'Projeler',
        S,
        context,
        icon: () => '🏗️',
      }),
      S.documentTypeListItem('newsItem').title('Haberler'),
      S.listItem()
        .title('Hakkımızda')
        .child(
          S.document()
            .schemaType('aboutPageV2')
            .documentId('aboutPageV2')
            .views([
              S.view.form().title('Düzenle'),
              S.view
                .component(PreviewView)
                .title('Önizleme')
                .icon(() => '👁️'),
            ]),
        ),
      S.listItem()
        .title('Üretim')
        .child(
          S.document()
            .schemaType('factoryPage')
            .documentId('factoryPage')
            .views([
              S.view.form().title('Düzenle'),
              S.view
                .component(PreviewView)
                .title('Önizleme')
                .icon(() => '👁️'),
            ]),
        ),
      S.listItem()
        .title('İletişim')
        .child(
          S.document()
            .schemaType('contactPage')
            .documentId('contact-page')
            .views([
              S.view.form().title('Düzenle'),
              S.view
                .component(PreviewView)
                .title('Önizleme')
                .icon(() => '👁️'),
            ]),
        ),
      S.listItem()
        .title('Altbilgi')
        .child(
          S.list()
            .title('Altbilgi')
            .items([
              S.listItem()
                .title('Genel Ayarlar')
                .child(
                  S.document()
                    .schemaType('footer')
                    .documentId('footer')
                    .views([
                      S.view.form().title('Düzenle'),
                      S.view
                        .component(PreviewView)
                        .title('Önizleme')
                        .icon(() => '👁️'),
                    ]),
                ),
              S.listItem()
                .title('Çerez Politikası')
                .child(
                  S.document()
                    .schemaType('cookiesPolicy')
                    .documentId('c18719f0-4fb1-4a05-9b0e-52e2406ab118'),
                ),
              S.listItem()
                .title('Gizlilik Politikası')
                .child(S.document().schemaType('privacyPolicy').documentId('gizlilikPolitikasi')),
              S.listItem()
                .title('Kullanım Şartları')
                .child(S.document().schemaType('termsOfService').documentId('kullanimSartlari')),
              S.listItem()
                .title('KVKK Aydınlatma Metni')
                .child(S.document().schemaType('kvkkPolicy').documentId('kvkkAydinlatmaMetni')),
            ]),
        ),
      S.documentTypeListItem('materialGroup').title('Malzeme Grupları'),
    ])
}
