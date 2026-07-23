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
      (() => {
        const item = orderableDocumentListDeskItem({
          type: 'category',
          title: 'Ürünler (Kategoriler & Modeller)',
          S,
          context,
          icon: () => '🪑',
        })
        if (item.child && typeof item.child === 'object') {
          const componentPane = item.child as unknown as Record<string, unknown>
          componentPane.child = (childId: string, childContext: unknown) => {
            const isEditor =
              childId.includes('view=editor') ||
              childId.includes('mode=edit') ||
              (childContext as {params?: {view?: string; mode?: string}} | undefined)?.params
                ?.view === 'editor' ||
              (childContext as {params?: {view?: string; mode?: string}} | undefined)?.params
                ?.mode === 'edit'

            const cleanId = childId
              .replace('drafts.', '')
              .replace(',view=editor', '')
              .replace(';view=editor', '')
              .split(',')[0]
              .split(';')[0]

            if (isEditor) {
              return S.document()
                .schemaType('category')
                .documentId(cleanId)
                .views([
                  S.view.form().title('Düzenle'),
                  S.view
                    .component(PreviewView)
                    .title('Önizleme')
                    .icon(() => '👁️'),
                ])
                .serialize()
            }

            return S.documentList()
              .title('Modeller')
              .schemaType('product')
              .filter(
                '_type == "product" && (category._ref == $catId || category._ref == $draftCatId)',
              )
              .params({
                catId: cleanId,
                draftCatId: `drafts.${cleanId}`,
              })
              .defaultOrdering([{field: 'orderRank', direction: 'asc'}])
              .apiVersion('2024-01-01')
              .menuItems([
                S.menuItem()
                  .title('Kategoriyi Düzenle')
                  .icon(() => '✏️')
                  .intent({
                    type: 'edit',
                    params: {id: cleanId, type: 'category'},
                  }),
                S.menuItem()
                  .title('Yeni Model Ekle')
                  .intent({type: 'create', params: {type: 'product'}}),
              ])
              .child((productId: string) =>
                S.document()
                  .schemaType('product')
                  .documentId(productId)
                  .views([
                    S.view.form().title('Düzenle'),
                    S.view
                      .component(PreviewView)
                      .title('Önizleme')
                      .icon(() => '👁️'),
                  ])
                  .serialize(),
              )
              .serialize()
          }
        }
        return item
      })(),
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
            .schemaType('aboutPage')
            .documentId('aboutPage')
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
            .documentId('contactPage')
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
                .child(S.document().schemaType('cookiesPolicy').documentId('cookiesPolicy')),
              S.listItem()
                .title('Gizlilik Politikası')
                .child(S.document().schemaType('privacyPolicy').documentId('privacyPolicy')),
              S.listItem()
                .title('Kullanım Şartları')
                .child(S.document().schemaType('termsOfService').documentId('termsOfService')),
              S.listItem()
                .title('KVKK Aydınlatma Metni')
                .child(S.document().schemaType('kvkkPolicy').documentId('kvkkPolicy')),
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
