import type {StructureBuilder} from 'sanity/structure'
import type {ConfigContext} from 'sanity'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {PreviewView} from './components/PreviewView'

export const deskStructure = (S: StructureBuilder, context: ConfigContext) => {
  return S.list()
    .title('İçerik')
    .items([
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
        .title('Fabrika')
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
                .child(
                  S.document().schemaType('privacyPolicy').documentId('gizlilikPolitikasi'),
                ),
              S.listItem()
                .title('Kullanım Şartları')
                .child(
                  S.document().schemaType('termsOfService').documentId('kullanimSartlari'),
                ),
              S.listItem()
                .title('KVKK Aydınlatma Metni')
                .child(
                  S.document().schemaType('kvkkPolicy').documentId('kvkkAydinlatmaMetni'),
                ),
            ]),
        ),
      S.documentTypeListItem('materialGroup').title('Malzeme Grupları'),
      // Üyeler
      S.listItem()
        .title('Üyeler')
        .child(
          S.list()
            .title('Üyeler')
            .items([
              S.listItem()
                .title('E-posta Aboneleri')
                .child(
                  S.documentList()
                    .title('E-posta Aboneleri')
                    .schemaType('user')
                    .filter('_type == "user" && userType == $t')
                    .params({t: 'email_subscriber'})
                    .apiVersion('2024-01-01'),
                ),
              S.listItem()
                .title('Profesyonel Aboneler')
                .child(
                  S.documentList()
                    .title('Profesyonel Aboneler')
                    .schemaType('user')
                    .filter('_type == "user" && userType == $t')
                    .params({t: 'professional_subscriber'})
                    .apiVersion('2024-01-01'),
                ),
              S.listItem()
                .title('Tam Üyeler')
                .child(
                  S.documentList()
                    .title('Tam Üyeler')
                    .schemaType('user')
                    .filter('_type == "user" && userType == $t')
                    .params({t: 'full_member'})
                    .apiVersion('2024-01-01'),
                ),
              S.divider(),
              S.documentTypeListItem('user').title('Tüm Üyeler'),
            ]),
        ),
    ])
}
