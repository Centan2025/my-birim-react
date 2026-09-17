import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'shopHomePage',
  title: 'Shop Ana Sayfası',
  type: 'document',
  groups: [
    {name: 'hero', title: '1. Hero Bölümü'},
    {name: 'selectedObjects', title: '2. Seçilmiş Objeler'},
    {name: 'editorial', title: '3. Editoryal Bölümler'},
    {name: 'categoryDiscovery', title: '4. Kategori Keşfi'},
    {name: 'featuredProduct', title: '5. Öne Çıkan Ürün (Closer Look)'},
    {name: 'seo', title: '6. SEO & Paylaşım'},
  ],
  fields: [
    // -------------------------------------------------------------
    // 1. HERO BÖLÜMÜ
    // -------------------------------------------------------------
    defineField({
      name: 'heroEnabled',
      title: 'Hero Aktif',
      type: 'boolean',
      initialValue: true,
      group: 'hero',
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Başlık',
      type: 'localizedString',
      group: 'hero',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Alt Başlık / Açıklama',
      type: 'localizedText',
      group: 'hero',
    }),
    defineField({
      name: 'heroMedia',
      title: 'Hero Görseli / Medyası (R2)',
      type: 'r2Asset',
      description:
        'Cloudflare R2 üzerinde saklanan, kırpma (crop) ve odak noktası (hotspot) özellikli ana görsel.',
      group: 'hero',
    }),
    defineField({
      name: 'heroCtaLabel',
      title: 'Hero Buton Metni',
      type: 'localizedString',
      group: 'hero',
    }),
    defineField({
      name: 'heroCtaTarget',
      title: 'Hero Buton Hedef URL',
      type: 'string',
      description: 'Örn: /categories veya /category/oturma',
      group: 'hero',
    }),

    // -------------------------------------------------------------
    // 2. SEÇİLMİŞ OBJELER (SELECTED OBJECTS)
    // -------------------------------------------------------------
    defineField({
      name: 'selectedObjectsTitle',
      title: 'Bölüm Başlığı',
      type: 'localizedString',
      group: 'selectedObjects',
    }),
    defineField({
      name: 'selectedObjectsSubtitle',
      title: 'Bölüm Alt Başlığı',
      type: 'localizedString',
      group: 'selectedObjects',
    }),
    defineField({
      name: 'selectedProducts',
      title: 'Seçilmiş Ürünler (Kürasyon)',
      description: 'Shop ana sayfasında öne çıkarılacak mevcut BİRİM ürünleri.',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'product'}],
        },
      ],
      group: 'selectedObjects',
    }),

    // -------------------------------------------------------------
    // 3. EDITORYAL BÖLÜMLER
    // -------------------------------------------------------------
    defineField({
      name: 'editorialSections',
      title: 'Editoryal Bloklar',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Editoryal Blok',
          fields: [
            defineField({
              name: 'heading',
              title: 'Başlık',
              type: 'localizedString',
            }),
            defineField({
              name: 'subheading',
              title: 'Alt Başlık / Kategori',
              type: 'localizedString',
            }),
            defineField({
              name: 'body',
              title: 'Metin',
              type: 'localizedText',
            }),
            defineField({
              name: 'media',
              title: 'Görsel (R2)',
              type: 'r2Asset',
              description: 'Cloudflare R2 görseli (Kırpma ve odak noktası destekli).',
            }),
            defineField({
              name: 'ctaLabel',
              title: 'Aksiyon Buton Metni',
              type: 'localizedString',
            }),
            defineField({
              name: 'ctaTarget',
              title: 'Aksiyon Hedef URL',
              type: 'string',
            }),
            defineField({
              name: 'layoutVariant',
              title: 'Yerleşim Düzeni',
              type: 'string',
              options: {
                list: [
                  {title: 'Görsel Solda, Metin Sağda', value: 'image_left'},
                  {title: 'Görsel Sağda, Metin Solda', value: 'image_right'},
                  {title: 'Tam Genişlik Banner (Metin Üzerinde)', value: 'full_banner'},
                ],
              },
              initialValue: 'image_left',
            }),
          ],
          preview: {
            select: {
              title: 'heading.tr',
              subtitle: 'layoutVariant',
              mediaUrl: 'media.url',
            },
            prepare({title, subtitle, mediaUrl}) {
              return {
                title: title || 'Editoryal Blok',
                subtitle: `Yerleşim: ${subtitle || 'image_left'}`,
                media: mediaUrl
                  ? () => (
                      <img
                        src={mediaUrl}
                        alt="Editorial Media"
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                      />
                    )
                  : undefined,
              }
            },
          },
        },
      ],
      group: 'editorial',
    }),

    // -------------------------------------------------------------
    // 4. KATEGORİ KEŞFİ (CATEGORY DISCOVERY)
    // -------------------------------------------------------------
    defineField({
      name: 'categoryDiscoveryTitle',
      title: 'Kategori Keşif Başlığı',
      type: 'localizedString',
      group: 'categoryDiscovery',
    }),
    defineField({
      name: 'categoryDiscoverySubtitle',
      title: 'Kategori Keşif Alt Başlığı',
      type: 'localizedString',
      group: 'categoryDiscovery',
    }),
    defineField({
      name: 'featuredCategories',
      title: 'Öne Çıkan Kategoriler',
      description: 'Shop ana sayfasında keşif için sergilenecek mevcut kategoriler.',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'category'}],
        },
      ],
      group: 'categoryDiscovery',
    }),

    // -------------------------------------------------------------
    // 5. ÖNE ÇIKAN ÜRÜN (CLOSER LOOK)
    // -------------------------------------------------------------
    defineField({
      name: 'featuredProductEnabled',
      title: 'Öne Çıkan Ürün Aktif',
      type: 'boolean',
      initialValue: true,
      group: 'featuredProduct',
    }),
    defineField({
      name: 'featuredProduct',
      title: 'Öne Çıkarılan Ürün',
      type: 'reference',
      to: [{type: 'product'}],
      group: 'featuredProduct',
    }),
    defineField({
      name: 'featuredProductHeadline',
      title: 'Özel Tanıtım Başlığı',
      type: 'localizedString',
      group: 'featuredProduct',
    }),
    defineField({
      name: 'featuredProductDescription',
      title: 'Özel Tanıtım Metni',
      type: 'localizedText',
      group: 'featuredProduct',
    }),
    defineField({
      name: 'featuredProductMedia',
      title: 'Özel Editoryal Görsel (R2 Opsiyonel)',
      type: 'r2Asset',
      description: 'Cloudflare R2 görseli (Kırpma ve odak noktası destekli).',
      group: 'featuredProduct',
    }),

    // -------------------------------------------------------------
    // 6. SEO & PAYLAŞIM
    // -------------------------------------------------------------
    defineField({
      name: 'seo',
      title: 'SEO & Sosyal Medya Ayarları',
      type: 'seoFields',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'heroTitle.tr',
      mediaUrl: 'heroMedia.url',
    },
    prepare({title, mediaUrl}) {
      return {
        title: title || 'BİRİM Shop Ana Sayfası',
        subtitle: 'Shop E-Commerce Home Singleton',
        media: mediaUrl
          ? () => (
              <img
                src={mediaUrl}
                alt="Hero Media"
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            )
          : undefined,
      }
    },
  },
})
