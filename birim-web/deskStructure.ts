import type {StructureBuilder} from 'sanity/structure'

export const deskStructure = (S: StructureBuilder) =>
  S.list()
    .title('İçerik')
    .items([
      S.listItem()
        .title('Kategoriler')
        .child(
          S.documentTypeList('category')
            .title('Kategoriler')
            .child((categoryId) =>
              S.documentList()
                .title('Ürünler')
                .filter('_type == "product" && references($catId)')
                .params({ catId: categoryId })
            )
        ),
      S.divider(),
      S.documentTypeListItem('designer').title('Tasarımcılar'),
      S.documentTypeListItem('project').title('Projeler'),
      S.documentTypeListItem('newsItem').title('Haberler'),
      S.divider(),
      S.documentTypeListItem('materialGroup').title('Malzeme Grupları'),
      S.divider(),
      S.documentTypeListItem('siteSettings').title('Site Ayarları'),
      S.documentTypeListItem('homePage').title('Ana Sayfa'),
      S.documentTypeListItem('aboutPage').title('Hakkımızda'),
      S.documentTypeListItem('contactPage').title('İletişim'),
      S.documentTypeListItem('footer').title('Altbilgi'),
    ])
