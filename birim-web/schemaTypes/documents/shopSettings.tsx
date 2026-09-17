import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'shopSettings',
  title: 'Shop Ayarları',
  type: 'document',
  groups: [
    {name: 'general', title: '1. Genel & Durum'},
    {name: 'localization', title: '2. Dil & Para Birimi'},
    {name: 'commerceMessages', title: '3. Ticari Mesajlar'},
    {name: 'contact', title: '4. İletişim & Destek'},
    {name: 'seo', title: '5. SEO Varsayılanları'},
  ],
  fields: [
    // -------------------------------------------------------------
    // 1. GENEL & DURUM
    // -------------------------------------------------------------
    defineField({
      name: 'shopEnabled',
      title: 'Shop Storefront Aktif',
      description: 'Kapalı olduğunda ziyaretçilere bakım/bilgi mesajı gösterilir.',
      type: 'boolean',
      initialValue: true,
      group: 'general',
    }),
    defineField({
      name: 'logoR2',
      title: 'Shop Logo',
      description: 'Mağaza için özel logo (Boş bırakılırsa genel site logosu kullanılır).',
      type: 'r2Asset',
      group: 'general',
    }),
    defineField({
      name: 'maintenanceMessage',
      title: 'Bakım / Kapalı Mesajı',
      type: 'localizedText',
      group: 'general',
    }),
    defineField({
      name: 'maintenanceImageR2',
      title: 'Bakım Modu Görseli',
      description: 'Mağaza kapalı/bakım modundayken gösterilecek görsel.',
      type: 'r2Asset',
      group: 'general',
    }),

    // -------------------------------------------------------------
    // 2. DİL & PARA BİRİMİ AYRIŞTIRMASI (LOCALIZATION & CURRENCIES)
    // -------------------------------------------------------------
    defineField({
      name: 'defaultLanguage',
      title: 'Varsayılan Dil',
      type: 'string',
      options: {
        list: [
          {title: 'Türkçe (TR)', value: 'tr'},
          {title: 'English (EN)', value: 'en'},
        ],
      },
      initialValue: 'tr',
      group: 'localization',
    }),
    defineField({
      name: 'availableLanguages',
      title: 'Aktif Diller',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Türkçe (TR)', value: 'tr'},
          {title: 'English (EN)', value: 'en'},
        ],
      },
      initialValue: ['tr', 'en'],
      group: 'localization',
    }),
    defineField({
      name: 'defaultCurrency',
      title: 'Varsayılan Para Birimi',
      type: 'string',
      options: {
        list: [
          {title: 'Türk Lirası (₺ - TRY)', value: 'TRY'},
          {title: 'Euro (€ - EUR)', value: 'EUR'},
          {title: 'US Dollar ($ - USD)', value: 'USD'},
        ],
      },
      initialValue: 'TRY',
      group: 'localization',
    }),
    defineField({
      name: 'supportedCurrencies',
      title: 'Desteklenen Para Birimleri',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Türk Lirası (TRY)', value: 'TRY'},
          {title: 'Euro (EUR)', value: 'EUR'},
          {title: 'US Dollar (USD)', value: 'USD'},
        ],
      },
      initialValue: ['TRY', 'EUR', 'USD'],
      group: 'localization',
    }),

    // -------------------------------------------------------------
    // 3. TİCARİ MESAJLAR & DUYURULAR
    // -------------------------------------------------------------
    defineField({
      name: 'announcementBannerEnabled',
      title: 'Üst Duyuru Bandı Aktif',
      type: 'boolean',
      initialValue: false,
      group: 'commerceMessages',
    }),
    defineField({
      name: 'announcementBannerText',
      title: 'Üst Duyuru Metni',
      type: 'localizedString',
      group: 'commerceMessages',
    }),
    defineField({
      name: 'announcementBannerImageR2',
      title: 'Üst Duyuru İkon / Görsel',
      type: 'r2Asset',
      group: 'commerceMessages',
    }),
    defineField({
      name: 'freeShippingThreshold',
      title: 'Ücretsiz Kargo Alt Limiti (TRY)',
      description: 'Bu tutar ve üzerindeki siparişlerde kargo ücretsiz tanımlanır.',
      type: 'number',
      initialValue: 5000,
      group: 'commerceMessages',
    }),
    defineField({
      name: 'shippingNotice',
      title: 'Teslimat & Kargo Bilgilendirme Notu',
      type: 'localizedString',
      group: 'commerceMessages',
    }),
    defineField({
      name: 'returnNotice',
      title: 'İade & Değişim Bilgilendirme Notu',
      type: 'localizedString',
      group: 'commerceMessages',
    }),

    // -------------------------------------------------------------
    // 4. İLETİŞİM & DESTEK
    // -------------------------------------------------------------
    defineField({
      name: 'supportEmail',
      title: 'Müşteri Hizmetleri E-Posta',
      type: 'string',
      initialValue: 'shop@birim.com',
      group: 'contact',
    }),
    defineField({
      name: 'supportPhone',
      title: 'Müşteri Hizmetleri Telefon',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'mainSiteUrl',
      title: 'Ana BİRİM.COM Bağlantısı',
      type: 'string',
      initialValue: 'https://www.birim.com',
      group: 'contact',
    }),

    // -------------------------------------------------------------
    // 5. SEO VARSAYILANLARI
    // -------------------------------------------------------------
    defineField({
      name: 'seo',
      title: 'Shop SEO Varsayılanları',
      type: 'seoFields',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      shopEnabled: 'shopEnabled',
      defaultCurrency: 'defaultCurrency',
      logoUrl: 'logoR2.url',
    },
    prepare({shopEnabled, defaultCurrency, logoUrl}) {
      return {
        title: 'BİRİM Shop Ayarları',
        subtitle: `Durum: ${shopEnabled ? '🟢 Açık' : '🔴 Kapalı'} | Para Birimi: ${defaultCurrency || 'TRY'}`,
        media: logoUrl
          ? () => (
              <img
                src={logoUrl}
                alt="Shop Logo"
                style={{width: '100%', height: '100%', objectFit: 'contain'}}
              />
            )
          : undefined,
      }
    },
  },
})
