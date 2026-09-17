import type {StructureBuilder} from 'sanity/structure'
import type {ConfigContext} from 'sanity'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {PreviewView} from './components/PreviewView'
import {AnalyticsStudioView} from './components/AnalyticsStudioView'
import {SupabaseUsersStudioView} from './components/SupabaseUsersStudioView'

export const deskStructure = (S: StructureBuilder, context: ConfigContext) => {
  return S.list()
    .title('BİRİM Yönetim')
    .items([
      // =============================================================
      // 1. BİRİM.COM (Ana Web Sitesi & Mimari Editoryal)
      // =============================================================
      S.listItem()
        .title('BİRİM.COM (Ana Site)')
        .icon(() => '🌐')
        .child(
          S.list()
            .title('BİRİM.COM İçerikleri')
            .items([
              S.listItem()
                .title('Ana Sayfa')
                .icon(() => '🏠')
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
              S.listItem()
                .title('Hakkımızda')
                .icon(() => '🏢')
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
                .title('Üretim / Fabrika')
                .icon(() => '🏭')
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
              orderableDocumentListDeskItem({
                type: 'project',
                title: 'Projeler',
                S,
                context,
                icon: () => '🏗️',
              }),
              S.documentTypeListItem('newsItem')
                .title('Haberler & Basın')
                .icon(() => '📰'),
              S.listItem()
                .title('İletişim')
                .icon(() => '✉️')
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
                .title('Altbilgi (Footer)')
                .icon(() => '📑')
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
            ]),
        ),

      // =============================================================
      // 2. BİRİM SHOP (E-Commerce Storefront)
      // =============================================================
      S.listItem()
        .title('BİRİM SHOP')
        .icon(() => '🛍️')
        .child(
          S.list()
            .title('BİRİM SHOP Yönetimi')
            .items([
              S.listItem()
                .title('Shop Ana Sayfası')
                .icon(() => '✨')
                .child(
                  S.document()
                    .schemaType('shopHomePage')
                    .documentId('shopHomePage')
                    .views([
                      S.view.form().title('Düzenle'),
                      S.view
                        .component(PreviewView)
                        .title('Önizleme')
                        .icon(() => '👁️'),
                    ]),
                ),
              S.listItem()
                .title('Shop Ayarları')
                .icon(() => '⚙️')
                .child(
                  S.document()
                    .schemaType('shopSettings')
                    .documentId('shopSettings')
                    .views([S.view.form().title('Düzenle')]),
                ),
            ]),
        ),

      S.divider(),

      // =============================================================
      // 3. ÜRÜNLER & KATALOG (ORTAK / SHARED CATALOG)
      // =============================================================
      S.listItem()
        .title('Ürünler & Katalog (Ortak)')
        .icon(() => '🪑')
        .child(
          S.list()
            .title('Ürünler & Katalog')
            .items([
              S.listItem()
                .title('Tüm Ürünler')
                .icon(() => '📦')
                .child(S.documentTypeList('product').title('Tüm Ürünler')),
              S.listItem()
                .title('Satışa Hazır (Commerce Ready)')
                .icon(() => '✅')
                .child(
                  S.documentTypeList('product')
                    .title('Satışa Hazır Ürünler')
                    .apiVersion('2024-01-01')
                    .filter(
                      `_type == "product" &&
                       isPublished == true &&
                       sale_enabled == true &&
                       buyable == true &&
                       defined(category) &&
                       (
                         (sales_mode == "DIRECT" && defined(price) && price > 0 && defined(currency) && defined(sku) && defined(stockStatus)) ||
                         (sales_mode == "CONFIGURABLE" && count(variants[enabled == true && defined(price) && price > 0 && defined(sku)]) > 0)
                       )`,
                    ),
                ),
              S.listItem()
                .title('İnceleme Gerektirenler (Needs Attention)')
                .icon(() => '⚠️')
                .child(
                  S.documentTypeList('product')
                    .title('İnceleme Gerektiren Satış Ürünleri')
                    .apiVersion('2024-01-01')
                    .filter(
                      `_type == "product" &&
                       sale_enabled == true &&
                       (
                         !defined(category) ||
                         buyable != true ||
                         !defined(sales_mode) ||
                         sales_mode in ["NONE", "QUOTE"] ||
                         !defined(stockStatus) ||
                         (sales_mode == "DIRECT" && (!defined(price) || price <= 0 || !defined(currency) || !defined(sku))) ||
                         (sales_mode == "CONFIGURABLE" && (count(variants[enabled == true]) == 0 || count(variants[enabled == true && (!defined(price) || price <= 0 || !defined(sku))]) > 0)) ||
                         count(media) == 0
                       )`,
                    ),
                ),
              S.divider(),
              S.listItem()
                .title('Stok Durumları (Inventory Health)')
                .icon(() => '🏷️')
                .child(
                  S.list()
                    .title('Stok Durumları')
                    .items([
                      S.listItem()
                        .title('Stokta Olanlar (In Stock)')
                        .icon(() => '🟢')
                        .child(
                          S.documentTypeList('product')
                            .title('Stokta Olan Ürünler')
                            .apiVersion('2024-01-01')
                            .filter('_type == "product" && stockStatus == "in_stock"'),
                        ),
                      S.listItem()
                        .title('Ön Sipariş (Preorder)')
                        .icon(() => '🟡')
                        .child(
                          S.documentTypeList('product')
                            .title('Ön Siparişteki Ürünler')
                            .apiVersion('2024-01-01')
                            .filter('_type == "product" && stockStatus == "preorder"'),
                        ),
                      S.listItem()
                        .title('Stok Dışı (Out of Stock)')
                        .icon(() => '🔴')
                        .child(
                          S.documentTypeList('product')
                            .title('Stok Dışı Ürünler')
                            .apiVersion('2024-01-01')
                            .filter('_type == "product" && stockStatus == "out_of_stock"'),
                        ),
                    ]),
                ),
              S.listItem()
                .title('Taslak & Yayında Olmayanlar')
                .icon(() => '📝')
                .child(
                  S.documentTypeList('product')
                    .title('Taslak & Yayında Olmayan Ürünler')
                    .apiVersion('2024-01-01')
                    .filter(
                      '_type == "product" && (_id in path("drafts.**") || isPublished == false)',
                    ),
                ),
              S.divider(),
              orderableDocumentListDeskItem({
                type: 'category',
                title: 'Kategoriler & Sıralama',
                S,
                context,
                icon: () => '📁',
              }),
              orderableDocumentListDeskItem({
                type: 'designer',
                title: 'Tasarımcılar',
                S,
                context,
                icon: () => '🎨',
              }),
              S.documentTypeListItem('materialGroup')
                .title('Malzeme Grupları')
                .icon(() => '🧱'),
            ]),
        ),

      S.divider(),

      // =============================================================
      // 4. KULLANICILAR & RAPORLAR
      // =============================================================
      S.listItem()
        .title('Kullanıcılar & Raporlar')
        .icon(() => '👥')
        .child(
          S.list()
            .title('Kullanıcılar & Raporlar')
            .items([
              S.listItem()
                .title('Site Analitiği')
                .icon(() => '📊')
                .child(S.component(AnalyticsStudioView).title('Google Analytics Raporu')),
              S.listItem()
                .title('Üyeler & Mimarlar')
                .icon(() => '👥')
                .child(S.component(SupabaseUsersStudioView).title('Üye & Mimar Yönetimi')),
            ]),
        ),

      // =============================================================
      // 5. SİTE AYARLARI & DİLLER
      // =============================================================
      S.listItem()
        .title('Site Ayarları & Diller')
        .icon(() => '⚙️')
        .child(
          S.list()
            .title('Site Ayarları & Diller')
            .items([
              S.listItem()
                .title('BİRİM.COM Genel Ayarlar')
                .icon(() => '🌐')
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
              S.listItem()
                .title('UI Çevirileri (Sözlük)')
                .icon(() => '📖')
                .child(S.document().schemaType('translations')),
            ]),
        ),

      // =============================================================
      // 6. YASAL METİNLER (ORTAK / SHARED LEGAL)
      // =============================================================
      S.listItem()
        .title('Yasal Metinler (Ortak)')
        .icon(() => '⚖️')
        .child(
          S.list()
            .title('Yasal Metinler & Sözleşmeler')
            .items([
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
              S.listItem()
                .title('Mesafeli Satış Sözleşmesi')
                .child(
                  S.documentTypeList('distanceSalesAgreement').title('Mesafeli Satış Sözleşmesi'),
                ),
              S.listItem()
                .title('Ön Bilgilendirme Formu')
                .child(S.documentTypeList('preliminaryInfoForm').title('Ön Bilgilendirme Formu')),
            ]),
        ),
    ])
}
