import type {StructureBuilder} from 'sanity/structure'

export const deskStructure = async (S: StructureBuilder, context: any) => {
  const {getClient} = context
  const client = getClient({apiVersion: '2024-01-01'})
  
  // Async işlemi burada yapıyoruz
  const categories = await client.fetch('*[_type == "category"] | order(name.tr asc)')
  
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
    ...categories.map((category: any) =>
      S.listItem()
        .title(category.name?.tr || category.name?.en || 'Kategori')
        .id(category._id)
        .child(
          S.list()
            .title('Kategori Detayı')
            .items([
              S.listItem()
                .title('Düzenle')
                .child(
                  S.document()
                    .schemaType('category')
                    .id(category._id)
                ),
              S.listItem()
                .title('Modeller')
                .child(
                  S.documentList()
                    .title('Modeller')
                    .filter('_type == "product" && references($catId)')
                    .params({ catId: category._id })
                ),
            ])
        )
    ),
  ]
  
  return S.list()
    .title('İçerik')
    .items([
      S.documentTypeListItem('siteSettings').title('Site Ayarları'),
      S.documentTypeListItem('homePage').title('Ana Sayfa'),
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
      S.documentTypeListItem('aboutPage').title('Hakkımızda'),
      S.documentTypeListItem('contactPage').title('İletişim'),
      S.documentTypeListItem('footer').title('Altbilgi'),
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
                ),
              S.listItem()
                .title('Tam Üyeler')
                .child(
                  S.documentList()
                    .title('Tam Üyeler')
                    .schemaType('user')
                    .filter('_type == "user" && userType == $t')
                    .params({ t: 'full_member' })
                ),
              S.divider(),
              S.documentTypeListItem('user').title('Tüm Üyeler'),
            ])
        ),
    ])
}
