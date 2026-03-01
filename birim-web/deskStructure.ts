import type {StructureBuilder} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {CategoryProductsView} from './components/CategoryProductsView'

export const deskStructure = async (S: StructureBuilder, context: any) => {
  const {getClient} = context
  const client = getClient({apiVersion: '2024-01-01'})

  // Async işlemleri burada yapıyoruz
  const cookiesPolicy = await client.fetch('*[_type == "cookiesPolicy"][0]')
  const privacyPolicy = await client.fetch('*[_type == "privacyPolicy"][0]')
  const termsOfService = await client.fetch('*[_type == "termsOfService"][0]')
  const kvkkPolicy = await client.fetch('*[_type == "kvkkPolicy"][0]')
  const siteSettingsDoc = await client.fetch('*[_type == "siteSettings"][0]')
  const homePage = await client.fetch('*[_type == "homePage"][0]')
  const aboutPage = await client.fetch('*[_type == "aboutPage"][0]')
  const contactPage = await client.fetch('*[_type == "contactPage"][0]')
  // Ensure we always use published ids (strip drafts.)
  const pubId = (id?: string): string => {
    if (!id || typeof id !== 'string') return ''
    return id.replace(/^drafts\./, '')
  }

  return S.list()
    .title('İçerik')
    .items([
      S.listItem()
        .title('Site Ayarları')
        .child(
          siteSettingsDoc?._id
            ? S.document().schemaType('siteSettings').id(pubId(siteSettingsDoc._id))
            : S.document().schemaType('siteSettings'),
        ),
      S.listItem().title('UI Çevirileri').child(S.document().schemaType('uiTranslations')),
      S.listItem()
        .title('Ana Sayfa')
        .child(
          homePage?._id
            ? S.document()
                .schemaType('homePage')
                .id(pubId(homePage._id) || 'homePage') // mevcut belgeyi doğrudan aç
            : S.document().schemaType('homePage'), // belge yoksa yeni oluştur
        ),
      S.listItem()
        .title('Ürünler')
        .child(
          S.list()
            .title('Ürün Yönetimi')
            .items([
              // Kategorileri Sırala - Sürükle-bırak özelliği
              orderableDocumentListDeskItem({
                type: 'category',
                title: 'Kategorileri Sırala (Sürükle-Bırak)',
                S,
                context,
                icon: () => '↕️',
              }),
              // Kategorileri Düzenle - Modeller görünümü ile
              S.listItem()
                .title('Kategorileri Düzenle')
                .icon(() => '📂')
                .schemaType('category')
                .child(
                  S.documentList()
                    .title('Kategoriler')
                    .schemaType('category')
                    .filter('_type == "category"')
                    .apiVersion('2024-01-01')
                    .defaultOrdering([{field: 'orderRank', direction: 'asc'}])
                    .child((categoryId) =>
                      S.document()
                        .schemaType('category')
                        .documentId(categoryId)
                        .views([
                          S.view
                            .form()
                            .title('Düzenle')
                            .icon(() => '✏️'),
                          S.view
                            .component(CategoryProductsView)
                            .title('Modeller')
                            .icon(() => '📦'),
                        ]),
                    ),
                ),
              S.divider(),
              S.documentTypeListItem('product').title('Tüm Modeller'),
            ]),
        ),
      orderableDocumentListDeskItem({
        type: 'designer',
        title: 'Tasarımcılar',
        S,
        context,
      }),
      S.documentTypeListItem('project').title('Projeler'),
      S.documentTypeListItem('newsItem').title('Haberler'),
      S.listItem()
        .title('Hakkımızda')
        .child(
          aboutPage?._id
            ? S.document()
                .schemaType('aboutPage')
                .id(pubId(aboutPage._id) || 'aboutPage') // mevcut belgeyi doğrudan aç
            : S.document().schemaType('aboutPage'), // belge yoksa yeni oluştur
        ),
      S.listItem()
        .title('İletişim')
        .child(
          contactPage?._id
            ? S.document()
                .schemaType('contactPage')
                .id(pubId(contactPage._id) || 'contactPage') // mevcut belgeyi doğrudan aç
            : S.document().schemaType('contactPage'), // belge yoksa yeni oluştur
        ),
      S.listItem()
        .title('Altbilgi')
        .child(
          S.list()
            .title('Altbilgi')
            .items([
              S.listItem().title('Genel Ayarlar').child(
                S.document().schemaType('footer').id('footer'), // tekil belge olarak doğrudan aç
              ),
              S.listItem()
                .title('Çerez Politikası')
                .child(
                  cookiesPolicy?._id
                    ? S.document()
                        .schemaType('cookiesPolicy')
                        .id(pubId(cookiesPolicy._id) || 'cookiesPolicy')
                    : S.document().schemaType('cookiesPolicy'),
                ),
              S.listItem()
                .title('Gizlilik Politikası')
                .child(
                  privacyPolicy?._id
                    ? S.document()
                        .schemaType('privacyPolicy')
                        .id(pubId(privacyPolicy._id) || 'privacyPolicy')
                    : S.document().schemaType('privacyPolicy'),
                ),
              S.listItem()
                .title('Kullanım Şartları')
                .child(
                  termsOfService?._id
                    ? S.document()
                        .schemaType('termsOfService')
                        .id(pubId(termsOfService._id) || 'termsOfService')
                    : S.document().schemaType('termsOfService'),
                ),
              S.listItem()
                .title('KVKK Aydınlatma Metni')
                .child(
                  kvkkPolicy?._id
                    ? S.document()
                        .schemaType('kvkkPolicy')
                        .id(pubId(kvkkPolicy._id) || 'kvkkPolicy')
                    : S.document().schemaType('kvkkPolicy'),
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
