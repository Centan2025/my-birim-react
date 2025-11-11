import {defineField, defineType} from 'sanity'
import UiTranslationsStringsInput from '../../components/UiTranslationsStringsInput'

export default defineType({
  name: 'uiTranslations',
  title: 'UI Çevirileri',
  type: 'document',
  fieldsets: [
    { name: 'nav', title: 'Navigasyon' },
    { name: 'search', title: 'Arama' },
    { name: 'auth', title: 'Giriş/Çıkış' },
    { name: 'labels', title: 'Etiketler' },
    { name: 'product', title: 'Ürün Detay' },
    { name: 'designer', title: 'Tasarımcı' },
    { name: 'news', title: 'Haberler' },
    { name: 'misc', title: 'Diğer' },
  ],
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
        // Navigasyon
        defineField({name: 'subscribe', title: 'Abone Ol', type: 'string', fieldset: 'nav'}),
        defineField({name: 'email_placeholder', title: 'E-posta Placeholder', type: 'string', fieldset: 'nav'}),
        defineField({name: 'designers', title: 'Tasarımcılar', type: 'string', fieldset: 'nav'}),
        defineField({name: 'news', title: 'Haberler', type: 'string', fieldset: 'nav'}),
        defineField({name: 'about', title: 'Hakkımızda', type: 'string', fieldset: 'nav'}),
        defineField({name: 'contact', title: 'İletişim', type: 'string', fieldset: 'nav'}),
        defineField({name: 'projects', title: 'Projeler', type: 'string', fieldset: 'nav'}),
        // Arama
        defineField({name: 'search_placeholder', title: 'Arama Placeholder', type: 'string', fieldset: 'search'}),
        defineField({name: 'search_no_results', title: 'Arama Sonuç Bulunamadı', type: 'string', fieldset: 'search'}),
        defineField({name: 'searching', title: 'Aranıyor', type: 'string', fieldset: 'search'}),
        // Etiketler
        defineField({name: 'products', title: 'Ürünler', type: 'string', fieldset: 'labels'}),
        defineField({name: 'categories', title: 'Kategoriler', type: 'string', fieldset: 'labels'}),
        defineField({name: 'designer', title: 'Tasarımcı', type: 'string', fieldset: 'labels'}),
        defineField({name: 'category', title: 'Kategori', type: 'string', fieldset: 'labels'}),
        defineField({name: 'homepage', title: 'Anasayfa', type: 'string', fieldset: 'labels'}),
        defineField({name: 'featured_products', title: 'Öne Çıkan Ürünler', type: 'string'}),
        defineField({name: 'featured_products_subtitle', title: 'Öne Çıkan Ürünler Alt Başlık', type: 'text'}),
        defineField({name: 'designer_spotlight', title: 'Tasarımcı Odağı', type: 'string', fieldset: 'labels'}),
        defineField({name: 'discover_the_designer', title: 'Tasarımcıyı Keşfet', type: 'string', fieldset: 'labels'}),
        defineField({name: 'sort', title: 'Sırala', type: 'string', fieldset: 'labels'}),
        defineField({name: 'sort_newest', title: 'En Yeni', type: 'string', fieldset: 'labels'}),
        defineField({name: 'sort_name_asc', title: 'İsme Göre (A-Z)', type: 'string', fieldset: 'labels'}),
        defineField({name: 'no_products_in_category', title: 'Kategoride Ürün Yok', type: 'string', fieldset: 'labels'}),
        defineField({name: 'loading', title: 'Yükleniyor', type: 'string', fieldset: 'labels'}),
        // Ürün detay
        defineField({name: 'description', title: 'Açıklama', type: 'string', fieldset: 'product'}),
        defineField({name: 'dimensions', title: 'Ölçüler', type: 'string', fieldset: 'product'}),
        defineField({name: 'material_alternatives', title: 'Malzeme Alternatifleri', type: 'string', fieldset: 'product'}),
        defineField({name: 'add_to_cart', title: 'Sepete Ekle', type: 'string'}),
        defineField({name: 'added_to_cart', title: 'Sepete Eklendi', type: 'string'}),
        defineField({name: 'exclusive_content', title: 'Özel İçerik', type: 'string', fieldset: 'product'}),
        defineField({name: 'additional_images', title: 'Ek Görseller', type: 'string', fieldset: 'product'}),
        defineField({name: 'technical_drawings', title: 'Teknik Çizimler', type: 'string', fieldset: 'product'}),
        // Sanity alan adları sayı ile başlayamaz; bu nedenle '3d_models' yerine 'models_3d' kullanılır
        defineField({name: 'models_3d', title: '3D Modeller', type: 'string', fieldset: 'product'}),
        defineField({name: 'product_not_found', title: 'Ürün Bulunamadı', type: 'string', fieldset: 'product'}),
        // Tasarımcı
        defineField({name: 'designer_not_found', title: 'Tasarımcı Bulunamadı', type: 'string', fieldset: 'designer'}),
        defineField({name: 'designs', title: 'Tasarımlar', type: 'string', fieldset: 'designer'}),
        defineField({name: 'no_products_by_designer', title: 'Tasarımcıya Ait Ürün Yok', type: 'string', fieldset: 'designer'}),
        // Giriş/Çıkış
        defineField({name: 'login', title: 'Giriş Yap', type: 'string', fieldset: 'auth'}),
        defineField({name: 'login_prompt', title: 'Giriş İsteği', type: 'string', fieldset: 'auth'}),
        defineField({name: 'login_test_creds', title: 'Test Kredileri', type: 'string', fieldset: 'auth'}),
        defineField({name: 'email', title: 'E-posta', type: 'string', fieldset: 'auth'}),
        defineField({name: 'password', title: 'Şifre', type: 'string', fieldset: 'auth'}),
        defineField({name: 'invalid_credentials', title: 'Geçersiz Krediler', type: 'string', fieldset: 'auth'}),
        defineField({name: 'already_logged_in', title: 'Zaten Giriş Yapıldı', type: 'string', fieldset: 'auth'}),
        defineField({name: 'logout', title: 'Çıkış Yap', type: 'string', fieldset: 'auth'}),
        // Haberler
        defineField({name: 'news_title', title: 'Haber Başlığı', type: 'string', fieldset: 'news'}),
        defineField({name: 'no_news', title: 'Haber Yok', type: 'string', fieldset: 'news'}),
        defineField({name: 'news_not_found', title: 'Haber Bulunamadı', type: 'string', fieldset: 'news'}),
        // Diğer
        defineField({name: 'products_page_subtitle', title: 'Ürünler Sayfası Alt Başlık', type: 'string', fieldset: 'misc'}),
        defineField({name: 'map_not_available', title: 'Harita Mevcut Değil', type: 'string', fieldset: 'misc'}),
        defineField({name: 'other_location_type', title: 'Diğer Lokasyon Tipi', type: 'string', fieldset: 'misc'}),
        defineField({name: 'previous_product', title: 'Önceki Ürün', type: 'string', fieldset: 'product'}),
        defineField({name: 'next_product', title: 'Sonraki Ürün', type: 'string', fieldset: 'product'}),
        defineField({name: 'navigation', title: 'Navigasyon', type: 'string', fieldset: 'misc'}),
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

