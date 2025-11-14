import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Ayarları',
  type: 'document',
  fields: [
    defineField({name: 'logo', title: 'Logo', type: 'image', options: {hotspot: true}}),
    defineField({name: 'topBannerText', title: 'Üst Bilgi Metni', type: 'string', description: 'Web sayfasının üstünde gösterilecek kısa bilgi/not.'}),
    defineField({name: 'showProductPrevNext', title: 'Önceki / Sonraki Düğmeleri (Ürünlerde, projelerde, haberlerde)', type: 'boolean', initialValue: false}),
    defineField({name: 'showCartButton', title: "Header'da Sepet Düğmesini Göster", type: 'boolean', initialValue: true}),
    defineField({name: 'isLanguageSwitcherVisible', title: 'Dil Değiştirici Gözüksün', type: 'boolean', initialValue: true}),
    defineField({
      name: 'maintenanceMode',
      title: 'Bakım Modu (Yakında Sayfası)',
      type: 'boolean',
      initialValue: false,
      description: 'Aktif edildiğinde ziyaretçiler sadece "Yakında" sayfasını görür. Development modunda otomatik olarak devre dışıdır.'
    }),
    defineField({
      name: 'imageBorderStyle',
      title: 'Görsel ve Video Kenar Stili',
      type: 'string',
      options: {
        list: [
          {title: 'Düz (Köşeler Keskin)', value: 'square'},
          {title: 'Yuvarlatılmış (Köşeler Yuvarlak)', value: 'rounded'}
        ],
        layout: 'radio'
      },
      initialValue: 'square'
    }),
    defineField({
      name: 'languages',
      title: 'Desteklenen Diller',
      type: 'array',
      of: [{
        type: 'object',
        name: 'language',
        fields: [
          { name: 'code', title: 'Dil Kodu (ör. tr, en, it)', type: 'string', validation: (Rule:any)=> Rule.required().regex(/^[a-z]{2}$/).error('2 harf küçük dil kodu girin (örn. tr)') },
          { name: 'title', title: 'Dil Başlığı (örn. Türkçe)', type: 'string' },
          { name: 'visible', title: 'Webte Göster', type: 'boolean', initialValue: true },
        ]
      }],
      // Sanity, obje dizilerinde Rule.unique() desteklemez; gerekirse custom validasyon eklenir
    }),
  ],
  preview: {
    select: {media: 'logo'},
    prepare({media}) {
      return {title: 'Site Ayarları', media}
    },
  },
})



