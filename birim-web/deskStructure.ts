import type {StructureBuilder} from 'sanity/structure'

export const deskStructure = async (S: StructureBuilder, context: any) => {
  const {getClient} = context
  const client = getClient({apiVersion: '2024-01-01'})
  
  // Async işlemleri burada yapıyoruz
  const categories = await client.fetch('*[_type == "category"] | order(name.tr asc)')
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
  
  // Kategoriler için items oluşturuyoruz
  const categoryItems = [
    S.listItem()
      .title('Yeni Kategori Ekle')
      .icon(() => '➕')
      .child(
        S.document()
          .schemaType('category')
      ),
    S.divider(),
    ...categories.map((category: any) => {
      const cleanId = pubId(category._id)
      return S.listItem()
        .title(category.name?.tr || category.name?.en || 'Kategori')
        .id(cleanId)
        .child(
          S.list()
            .title('Kategori Detayı')
            .items([
              S.listItem()
                .title('Düzenle')
                .child(
                  S.document()
                    .schemaType('category')
                    .id(cleanId)
                ),
              S.listItem()
                .title('Modeller')
                .child(
                  S.documentList()
                    .title('Modeller')
                    .filter('_type == "product" && references($catId)')
                    .params({ catId: cleanId })
                    .apiVersion('2024-01-01')
                ),
            ])
        )
    }),
  ]
  
  return S.list()
    .title('İçerik')
    .items([
      S.listItem()
        .title('Site Ayarları')
        .child(
          siteSettingsDoc?._id
            ? S.document().schemaType('siteSettings').id(pubId(siteSettingsDoc._id))
            : S.document().schemaType('siteSettings')
        ),
      S.listItem()
        .title('UI Çevirileri')
        .child(
          S.document()
            .schemaType('uiTranslations')
        ),
      S.listItem()
        .title('Ana Sayfa')
        .child(
          homePage?._id
            ? S.document()
                .schemaType('homePage')
                .id(pubId(homePage._id) || 'homePage') // mevcut belgeyi doğrudan aç
            : S.document()
                .schemaType('homePage') // belge yoksa yeni oluştur
        ),
      S.listItem()
        .title('Ürünler')
        .child(
          S.list()
            .title('Ürünler')
            .items(categoryItems)
        ),
      S.documentTypeListItem('designer').title('Tasarımcılar'),
      S.documentTypeListItem('project').title('Projeler'),
      S.documentTypeListItem('newsItem').title('Haberler'),
      S.listItem()
        .title('Hakkımızda')
        .child(
          aboutPage?._id
            ? S.document()
                .schemaType('aboutPage')
                .id(pubId(aboutPage._id) || 'aboutPage') // mevcut belgeyi doğrudan aç
            : S.document()
                .schemaType('aboutPage') // belge yoksa yeni oluştur
        ),
      S.listItem()
        .title('İletişim')
        .child(
          contactPage?._id
            ? S.document()
                .schemaType('contactPage')
                .id(pubId(contactPage._id) || 'contactPage') // mevcut belgeyi doğrudan aç
            : S.document()
                .schemaType('contactPage') // belge yoksa yeni oluştur
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
                    .id('footer') // tekil belge olarak doğrudan aç
                ),
              S.listItem()
                .title('Çerez Politikası')
                .child(
                  S.document()
                    .schemaType('cookiesPolicy')
                    .id('cookiesPolicy')
                ),
              S.listItem()
                .title('Gizlilik Politikası')
                .child(
                  S.document()
                    .schemaType('privacyPolicy')
                    .id('privacyPolicy')
                ),
              S.listItem()
                .title('Kullanım Şartları')
                .child(
                  S.document()
                    .schemaType('termsOfService')
                    .id('termsOfService')
                ),
              S.listItem()
                .title('KVKK Aydınlatma Metni')
                .child(
                  S.document()
                    .schemaType('kvkkPolicy')
                    .id('kvkkPolicy')
                ),
            ])
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
                    .params({ t: 'email_subscriber' })
                    .apiVersion('2024-01-01')
                ),
              S.listItem()
                .title('Tam Üyeler')
                .child(
                  S.documentList()
                    .title('Tam Üyeler')
                    .schemaType('user')
                    .filter('_type == "user" && userType == $t')
                    .params({ t: 'full_member' })
                    .apiVersion('2024-01-01')
                ),
              S.divider(),
              S.documentTypeListItem('user').title('Tüm Üyeler'),
            ])
        ),
    ])
}
