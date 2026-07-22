import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'seoFields',
  title: 'SEO & Arama Motoru Ayarları',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Başlık (Meta Title)',
      type: 'localizedString',
      description: 'Arama motoru sonuçlarında görünecek başlık. Boş bırakılırsa ürün/sayfa adı kullanılır.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Açıklama (Meta Description)',
      type: 'localizedText',
      description: 'Arama motoru sonuçlarında başlığın altında görünecek özet açıklama.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Sosyal Medya Görseli (OpenGraph Image)',
      type: 'r2Asset',
      description: 'Bağlantı WhatsApp, LinkedIn, Facebook vb. platformlarda paylaşıldığında görünecek resim.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Arama Motorlarında Gizle (noindex)',
      type: 'boolean',
      initialValue: false,
      description: 'İşaretlenirse bu sayfa Google ve diğer arama motorları tarafından indekslenmez.',
    }),
  ],
})
