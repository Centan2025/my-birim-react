import {defineField, defineType} from 'sanity'
import UiTranslationsStringsInput from '../../components/UiTranslationsStringsInput'

export default defineType({
  name: 'uiTranslations',
  title: 'UI Çevirileri',
  type: 'document',
  fields: [
    defineField({
      name: 'language',
      title: 'Dil',
      type: 'string',
      options: {
        list: [
          {title: 'Türkçe', value: 'tr'},
          {title: 'English', value: 'en'},
          {title: 'Italiano', value: 'it'},
          {title: 'Deutsch', value: 'de'},
          {title: 'Français', value: 'fr'},
          {title: 'Español', value: 'es'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'strings',
      title: 'Çeviri Metinleri',
      type: 'object',
      components: {
        input: UiTranslationsStringsInput
      },
      fields: [
        defineField({name: 'collection', title: 'Koleksiyon', type: 'string'}),
        defineField({name: 'subscribe', title: 'Abone Ol', type: 'string'}),
        defineField({name: 'email_placeholder', title: 'E-posta Placeholder', type: 'string'}),
        defineField({name: 'designers', title: 'Tasarımcılar', type: 'string'}),
        defineField({name: 'news', title: 'Haberler', type: 'string'}),
        defineField({name: 'about', title: 'Hakkımızda', type: 'string'}),
        defineField({name: 'contact', title: 'İletişim', type: 'string'}),
        defineField({name: 'projects', title: 'Projeler', type: 'string'}),
        defineField({name: 'search_placeholder', title: 'Arama Placeholder', type: 'string'}),
        defineField({name: 'search_no_results', title: 'Arama Sonuç Bulunamadı', type: 'string'}),
        defineField({name: 'searching', title: 'Aranıyor', type: 'string'}),
        defineField({name: 'products', title: 'Ürünler', type: 'string'}),
        defineField({name: 'categories', title: 'Kategoriler', type: 'string'}),
        defineField({name: 'designer', title: 'Tasarımcı', type: 'string'}),
        defineField({name: 'category', title: 'Kategori', type: 'string'}),
        defineField({name: 'featured_products', title: 'Öne Çıkan Ürünler', type: 'string'}),
        defineField({name: 'featured_products_subtitle', title: 'Öne Çıkan Ürünler Alt Başlık', type: 'text'}),
        defineField({name: 'designer_spotlight', title: 'Tasarımcı Odağı', type: 'string'}),
        defineField({name: 'discover_the_designer', title: 'Tasarımcıyı Keşfet', type: 'string'}),
        defineField({name: 'sort', title: 'Sırala', type: 'string'}),
        defineField({name: 'sort_newest', title: 'En Yeni', type: 'string'}),
        defineField({name: 'sort_name_asc', title: 'İsme Göre (A-Z)', type: 'string'}),
        defineField({name: 'no_products_in_category', title: 'Kategoride Ürün Yok', type: 'string'}),
        defineField({name: 'loading', title: 'Yükleniyor', type: 'string'}),
        defineField({name: 'homepage', title: 'Anasayfa', type: 'string'}),
        defineField({name: 'description', title: 'Açıklama', type: 'string'}),
        defineField({name: 'dimensions', title: 'Ölçüler', type: 'string'}),
        defineField({name: 'material_alternatives', title: 'Malzeme Alternatifleri', type: 'string'}),
        defineField({name: 'add_to_cart', title: 'Sepete Ekle', type: 'string'}),
        defineField({name: 'added_to_cart', title: 'Sepete Eklendi', type: 'string'}),
        defineField({name: 'exclusive_content', title: 'Özel İçerik', type: 'string'}),
        defineField({name: 'additional_images', title: 'Ek Görseller', type: 'string'}),
        defineField({name: 'technical_drawings', title: 'Teknik Çizimler', type: 'string'}),
        // Sanity alan adları sayı ile başlayamaz; bu nedenle '3d_models' yerine 'models_3d' kullanılır
        defineField({name: 'models_3d', title: '3D Modeller', type: 'string'}),
        defineField({name: 'product_not_found', title: 'Ürün Bulunamadı', type: 'string'}),
        defineField({name: 'designer_not_found', title: 'Tasarımcı Bulunamadı', type: 'string'}),
        defineField({name: 'designs', title: 'Tasarımlar', type: 'string'}),
        defineField({name: 'no_products_by_designer', title: 'Tasarımcıya Ait Ürün Yok', type: 'string'}),
        defineField({name: 'login', title: 'Giriş Yap', type: 'string'}),
        defineField({name: 'login_prompt', title: 'Giriş İsteği', type: 'string'}),
        defineField({name: 'login_test_creds', title: 'Test Kredileri', type: 'string'}),
        defineField({name: 'email', title: 'E-posta', type: 'string'}),
        defineField({name: 'password', title: 'Şifre', type: 'string'}),
        defineField({name: 'invalid_credentials', title: 'Geçersiz Krediler', type: 'string'}),
        defineField({name: 'already_logged_in', title: 'Zaten Giriş Yapıldı', type: 'string'}),
        defineField({name: 'logout', title: 'Çıkış Yap', type: 'string'}),
        defineField({name: 'news_title', title: 'Haber Başlığı', type: 'string'}),
        defineField({name: 'no_news', title: 'Haber Yok', type: 'string'}),
        defineField({name: 'products_page_subtitle', title: 'Ürünler Sayfası Alt Başlık', type: 'string'}),
        defineField({name: 'map_not_available', title: 'Harita Mevcut Değil', type: 'string'}),
        defineField({name: 'other_location_type', title: 'Diğer Lokasyon Tipi', type: 'string'}),
        defineField({name: 'previous_product', title: 'Önceki Ürün', type: 'string'}),
        defineField({name: 'next_product', title: 'Sonraki Ürün', type: 'string'}),
        defineField({name: 'news_not_found', title: 'Haber Bulunamadı', type: 'string'}),
        // Yönetim paneliyle ilgili ve kullanılmayan alanlar şemadan kaldırıldı
      ],
    }),
  ],
  preview: {
    select: {
      language: 'language',
    },
    prepare({language}) {
      const langNames: Record<string, string> = {
        tr: 'Türkçe',
        en: 'English',
        it: 'Italiano',
        de: 'Deutsch',
        fr: 'Français',
        es: 'Español',
      };
      return {
        title: `Çeviriler - ${langNames[language] || language}`,
      };
    },
  },
})

