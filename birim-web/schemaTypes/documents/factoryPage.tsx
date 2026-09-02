import React from 'react'
import {defineField, defineType} from 'sanity'
import BulkMediaUploadInput from '../../components/BulkMediaUploadInput'

export default defineType({
  name: 'factoryPage',
  title: 'Fabrika',
  type: 'document',
  fieldsets: [
    {
      name: 'heroGroup',
      title: '🎬 Hero Bölümü',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'metricsGroup',
      title: '📊 Kapasite & Metrikler',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'disciplinesGroup',
      title: '⚙️ Üretim Disiplinleri / Departmanları',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'philosophyGroup',
      title: '💡 Üretim Felsefesi & Açıklama',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'mediaGroup',
      title: '🖼️ Görsel Galerisi & Arşiv',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'sustainabilityGroup',
      title: '🌱 Kalite, Sürdürülebilirlik & Eylemler',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'seoGroup',
      title: '🔍 SEO & Arama Motoru',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Sayfa Başlığı',
      type: 'localizedString',
      fieldset: 'heroGroup',
      initialValue: {tr: 'Fabrika', en: 'Factory'},
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Ana Başlık',
      type: 'localizedString',
      fieldset: 'heroGroup',
      initialValue: {
        tr: 'Zanaatın Endüstriyel Ölçekle Buluşması',
        en: 'Where Craftsmanship Meets Industrial Scale',
      },
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Açıklama Metni',
      type: 'localizedString',
      fieldset: 'heroGroup',
      initialValue: {
        tr: 'Birim’in 15.000 m² entegre üretim tesisi; ahşap, metal, döşeme ve yüzey işlem atölyelerini mikron düzeyinde hassasiyetle tek çatı altında buluşturuyor.',
        en: 'Birim’s 15,000 m² integrated manufacturing facility unites woodworking, metal fabrication, upholstery, and finishing with micro-precision under one roof.',
      },
    }),
    defineField({
      name: 'heroImageR2',
      title: 'Hero Özel Görseli (R2)',
      type: 'r2Asset',
      fieldset: 'heroGroup',
      description: 'Boş bırakılırsa galerideki ilk görsel kullanılır.',
    }),

    // 2. METRİKLER
    defineField({
      name: 'metrics',
      title: 'Kapasite & Öne Çıkan Metrikler',
      type: 'array',
      fieldset: 'metricsGroup',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'value', title: 'Değer (Örn: 15.000 m²)', type: 'localizedString'}),
            defineField({name: 'label', title: 'Açıklama', type: 'localizedString'}),
          ],
          preview: {
            select: {
              title: 'value.tr',
              subtitle: 'label.tr',
            },
          },
        },
      ],
      initialValue: [
        {
          value: {tr: '15.000 m²', en: '15,000 m²'},
          label: {
            tr: 'Entegre kapalı üretim tesisi ve modern makine parkuru',
            en: 'Integrated manufacturing facility and advanced machine park',
          },
        },
        {
          value: {tr: '50+ Yıl', en: '50+ Yrs'},
          label: {
            tr: 'Kuşaktan kuşağa aktarılan zanaatkarlık mirası ve uzmanlık',
            en: 'Generations of artisanal mastery and manufacturing know-how',
          },
        },
        {
          value: {tr: '4 Disiplin', en: '4 Units'},
          label: {
            tr: 'Ahşap, Metal, Döşeme ve Yüzey İşlem tek çatı altında',
            en: 'Wood, Metal, Upholstery & Finishing under single management',
          },
        },
        {
          value: {tr: '%100 FSC', en: '100% FSC'},
          label: {
            tr: 'Sürdürülebilir orman kaynakları ve çevre dostu üretim',
            en: 'Sustainably sourced certified timber & eco-conscious processes',
          },
        },
      ],
    }),

    // 3. DİSİPLİNLER
    defineField({
      name: 'disciplinesTag',
      title: 'Disiplinler Üst Etiket',
      type: 'localizedString',
      fieldset: 'disciplinesGroup',
      initialValue: {tr: 'ÜRETİM DEPARTMANLARI', en: 'PRODUCTION UNITS'},
    }),
    defineField({
      name: 'disciplinesTitle',
      title: 'Disiplinler Bölüm Başlığı',
      type: 'localizedString',
      fieldset: 'disciplinesGroup',
      initialValue: {tr: 'Entegre Üretim Disiplinleri', en: 'Integrated Manufacturing Units'},
    }),
    defineField({
      name: 'disciplinesDescription',
      title: 'Disiplinler Bölüm Açıklaması',
      type: 'localizedString',
      fieldset: 'disciplinesGroup',
      initialValue: {
        tr: 'Fikirden nihai ürüne kadar tüm aşamaları kendi bünyesinde çözen esnek ve güçlü üretim ekosistemi.',
        en: 'A flexible and high-capacity manufacturing ecosystem resolving every detail from sketch to final production in-house.',
      },
    }),
    defineField({
      name: 'disciplines',
      title: 'Üretim Disiplinleri Listesi',
      type: 'array',
      fieldset: 'disciplinesGroup',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'id', title: 'Benzersiz Kimlik (id)', type: 'string'}),
            defineField({name: 'title', title: 'Disiplin Başlığı', type: 'localizedString'}),
            defineField({
              name: 'subtitle',
              title: 'Alt Başlık / Teknoloji',
              type: 'localizedString',
            }),
            defineField({name: 'description', title: 'Detaylı Açıklama', type: 'localizedString'}),
            defineField({
              name: 'features',
              title: 'Öne Çıkan Maddeler / Kabiliyetler',
              type: 'array',
              of: [{type: 'localizedString'}],
            }),
            defineField({name: 'imageR2', title: 'Disiplin Görseli (R2)', type: 'r2Asset'}),
          ],
          preview: {
            select: {
              title: 'title.tr',
              subtitle: 'subtitle.tr',
            },
          },
        },
      ],
    }),

    // 4. FELSEFE
    defineField({
      name: 'philosophyTag',
      title: 'Felsefe Üst Etiket',
      type: 'localizedString',
      fieldset: 'philosophyGroup',
      initialValue: {tr: 'ÜRETİM FELSEFESİ', en: 'PHILOSOPHY'},
    }),
    defineField({
      name: 'philosophyTitle',
      title: 'Felsefe Başlığı',
      type: 'localizedString',
      fieldset: 'philosophyGroup',
      initialValue: {
        tr: 'Endüstrinin Hızı, El İşçiliğinin Ruhu',
        en: 'Industrial Speed, Handcrafted Soul',
      },
    }),
    defineField({
      name: 'philosophySubtitle',
      title: 'Felsefe Alt Başlığı',
      type: 'localizedString',
      fieldset: 'philosophyGroup',
      initialValue: {
        tr: 'Her parçanın ardında onlarca yıllık zanaat birikimi ve ileri mühendislik disiplini yer alır.',
        en: 'Behind every piece lies decades of artisanal heritage combined with rigorous engineering.',
      },
    }),
    defineField({
      name: 'content',
      title: 'Açıklama / Felsefe Detay Metni',
      type: 'localizedPortableText',
      fieldset: 'philosophyGroup',
    }),

    // 5. GÖRSEL ARŞİV / GALERİ
    defineField({
      name: 'galleryTag',
      title: 'Galeri Üst Etiket',
      type: 'localizedString',
      fieldset: 'mediaGroup',
      initialValue: {tr: 'GÖRSEL ARŞİV', en: 'VISUAL ARCHIVE'},
    }),
    defineField({
      name: 'galleryTitle',
      title: 'Galeri Başlığı',
      type: 'localizedString',
      fieldset: 'mediaGroup',
      initialValue: {tr: 'Atölyelerden Kareler', en: 'Inside the Factory'},
    }),
    defineField({
      name: 'gallerySubtitle',
      title: 'Galeri Alt Açıklaması',
      type: 'localizedString',
      fieldset: 'mediaGroup',
      initialValue: {
        tr: 'Görselleri tam ekran incelemek için üzerlerine tıklayabilirsiniz.',
        en: 'Click on any image to view in fullscreen high-resolution mode.',
      },
    }),
    defineField({
      name: 'gallery',
      title: 'Görsel Galerisi',
      type: 'array',
      fieldset: 'mediaGroup',
      of: [{type: 'productPanelMediaItem'}],
      components: {
        input: BulkMediaUploadInput,
      },
      description: 'Fabrikaya ait yüksek çözünürlüklü görseller veya videolar.',
    }),

    // 6. SÜRDÜRÜLEBİLİRLİK & EYLEM
    defineField({
      name: 'sustainabilityTag',
      title: 'Taahhüt Üst Etiket',
      type: 'localizedString',
      fieldset: 'sustainabilityGroup',
      initialValue: {tr: 'KALİTE & TAAHHÜT', en: 'QUALITY & SUSTAINABILITY'},
    }),
    defineField({
      name: 'sustainabilityTitle',
      title: 'Taahhüt Başlığı',
      type: 'localizedString',
      fieldset: 'sustainabilityGroup',
      initialValue: {
        tr: 'Geleceğe Saygılı, Uzun Ömürlü Mobilya Üretimi',
        en: 'Eco-Conscious, Long-Lasting Furniture Creation',
      },
    }),
    defineField({
      name: 'sustainabilityDescription',
      title: 'Taahhüt Açıklaması',
      type: 'localizedString',
      fieldset: 'sustainabilityGroup',
      initialValue: {
        tr: 'Birim üretim felsefesi; atık minimizasyonu, %100 geri dönüştürülebilir metal iskeletler ve sertifikalı ahşap kaynakları kullanarak nesiller boyu kullanılacak dayanıklı mobilyalar inşa etmeyi temel alır.',
        en: 'Birim’s manufacturing ethos is grounded in waste minimization, 100% recyclable metal structures, and certified forest timber to build furniture that lasts for generations.',
      },
    }),
    defineField({
      name: 'ctaPrimaryText',
      title: 'Birinci Buton Metni',
      type: 'localizedString',
      fieldset: 'sustainabilityGroup',
      initialValue: {tr: 'İletişime Geçin', en: 'Contact Us'},
    }),
    defineField({
      name: 'ctaPrimaryLink',
      title: 'Birinci Buton Linki',
      type: 'string',
      fieldset: 'sustainabilityGroup',
      initialValue: '/contact',
    }),
    defineField({
      name: 'ctaSecondaryText',
      title: 'İkinci Buton Metni',
      type: 'localizedString',
      fieldset: 'sustainabilityGroup',
      initialValue: {tr: 'Projelerimizi İnceleyin', en: 'Explore Projects'},
    }),
    defineField({
      name: 'ctaSecondaryLink',
      title: 'İkinci Buton Linki',
      type: 'string',
      fieldset: 'sustainabilityGroup',
      initialValue: '/projects',
    }),

    // 7. SEO
    defineField({
      name: 'seo',
      title: 'SEO & Arama Motoru Ayarları',
      type: 'seoFields',
      fieldset: 'seoGroup',
    }),
  ],
  preview: {
    select: {
      title: 'title.tr',
    },
    prepare(selection: any) {
      const {title} = selection
      return {
        title: title || 'Fabrika',
      }
    },
  },
})
