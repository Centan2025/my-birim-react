import {createClient} from '@sanity/client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const projectId = process.env.VITE_SANITY_PROJECT_ID || 'wn3a082f'
const dataset = process.env.VITE_SANITY_DATASET || 'production'
const token = process.env.SANITY_TOKEN || process.env.VITE_SANITY_TOKEN

if (!token) {
  console.error('❌ SANITY_TOKEN bulunamadı!')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
})

async function uploadImage(filePath, filename) {
  console.log(`📤 ${filename} Sanity Varlıkları deposuna yükleniyor...`)
  const stream = fs.createReadStream(filePath)
  const asset = await client.assets.upload('image', stream, {filename})
  console.log(`✅ ${filename} yüklendi! URL: ${asset.url}`)
  return asset
}

async function main() {
  try {
    const heroAsset = await uploadImage(path.resolve('public/img/about/hero.jpg'), 'hero.jpg')
    const historyAsset = await uploadImage(
      path.resolve('public/img/about/history.jpg'),
      'history.jpg'
    )
    const identityAsset = await uploadImage(
      path.resolve('public/img/about/identity.jpg'),
      'identity.jpg'
    )
    const qualityAsset = await uploadImage(
      path.resolve('public/img/about/quality.jpg'),
      'quality.jpg'
    )

    function toSanityImage(asset) {
      return {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      }
    }

    function toR2Asset(asset, alt) {
      return {
        _type: 'r2Asset',
        url: asset.url,
        alt,
        mimeType: 'image/jpeg',
        width: asset.metadata?.dimensions?.width || 2000,
        height: asset.metadata?.dimensions?.height || 1333,
        hasResponsiveSizes: false,
      }
    }

    const doc = {
      _id: 'aboutPageV2',
      _type: 'aboutPageV2',
      heroImage: toSanityImage(heroAsset),
      heroImageR2: toR2Asset(heroAsset, 'Birim Mimari Hero'),
      heroTitle: {
        tr: 'HAKKIMIZDA',
        en: 'ABOUT US',
      },
      heroSubtitle: {
        tr: 'Zamansız zanaat ve mimari estetiğin sentezi.',
        en: 'The synthesis of timeless craft and architectural aesthetics.',
      },
      manifestoLabel: {
        tr: 'Felsefemiz',
        en: 'Our Philosophy',
      },
      manifestoQuote: {
        tr: '“Bir mekanın karakteri, kullanılan malzemenin dürüstlüğü ve zanaatın inceliğiyle şekillenir.”',
        en: '“The character of a space is shaped by the honesty of materials and the refinement of craft.”',
      },
      timelineTitle: {
        tr: '50+ Yıllık Dönüm Noktaları',
        en: '50+ Years of Milestones',
      },
      timelineSubtitle: {
        tr: 'Kuruluşumuzdan bu yana zamansız tasarım anlayışımızın kilometre taşları.',
        en: 'Milestones of our timeless design philosophy since our founding.',
      },
      eras: [
        {
          _key: 'era-1970',
          _type: 'eraItem',
          year: '1970',
          title: {
            tr: 'Temeller ve Kuruluş',
            en: 'Foundations & Inception',
          },
          description: {
            tr: 'İstanbul’da geleneksel mobilya zanaatını mimari hassasiyetle birleştiren ilk atölyenin kuruluşu.',
            en: 'Inception of the first workshop in Istanbul blending traditional craft with architectural precision.',
          },
          image: toSanityImage(historyAsset),
          imageR2: toR2Asset(historyAsset, 'Temeller ve Kuruluş'),
        },
        {
          _key: 'era-1992',
          _type: 'eraItem',
          year: '1992',
          title: {
            tr: 'Endüstriyel Ölçek ve Fabrika',
            en: 'Industrial Scale & Factory',
          },
          description: {
            tr: 'Teknolojik altyapının güçlendirilmesi ve modern mobilya üretimine yönelik entegre tesis hamlesi.',
            en: 'Enhancing technological infrastructure and launching an integrated facility for modern furniture production.',
          },
          image: toSanityImage(qualityAsset),
          imageR2: toR2Asset(qualityAsset, 'Endüstriyel Ölçek'),
        },
        {
          _key: 'era-2008',
          _type: 'eraItem',
          year: '2008',
          title: {
            tr: 'Global Tasarımcı Koleksiyonları',
            en: 'Global Designer Collections',
          },
          description: {
            tr: 'Uluslararası saygınlığa sahip endüstriyel tasarımcılarla özgün ve ikonik seri tasarımların başlanması.',
            en: 'Collaborations with internationally acclaimed industrial designers to craft iconic collections.',
          },
          image: toSanityImage(identityAsset),
          imageR2: toR2Asset(identityAsset, 'Global Koleksiyonlar'),
        },
        {
          _key: 'era-today',
          _type: 'eraItem',
          year: 'Günümüz',
          title: {
            tr: 'Sürdürülebilir Mimari Lüks',
            en: 'Sustainable Architectural Luxury',
          },
          description: {
            tr: 'Dünyanın dört bir yanındaki prestijli konut ve ticari projelere zamansız mobilya çözümleri sunumu.',
            en: 'Delivering timeless furniture solutions to prestigious residential and commercial projects worldwide.',
          },
          image: toSanityImage(heroAsset),
          imageR2: toR2Asset(heroAsset, 'Sürdürülebilir Lüks'),
        },
      ],
      historySection: {
        title: {
          tr: 'TARİHÇEMİZ VE KÖKENLERİMİZ',
          en: 'OUR HISTORY & ORIGINS',
        },
        content: {
          tr: [
            {
              _key: 'h-tr-1',
              _type: 'block',
              style: 'normal',
              children: [
                {
                  _key: 'h-tr-1-span',
                  _type: 'span',
                  text: '1970 yılında kurulan Birim, yarım asrı aşkın süredir Türk mobilya tasarımına ve üretim kültürüne yön vermektedir. Ahşabın doğal dokusunu endüstriyel titizlikle buluşturan markamız, kurulduğu günden bu yana zamansız mekanlar yaratma arzusuyla hareket eder.',
                },
              ],
            },
          ],
          en: [
            {
              _key: 'h-en-1',
              _type: 'block',
              style: 'normal',
              children: [
                {
                  _key: 'h-en-1-span',
                  _type: 'span',
                  text: 'Founded in 1970, Birim has been guiding Turkish furniture design and production culture for over half a century.',
                },
              ],
            },
          ],
        },
        image: toSanityImage(historyAsset),
        imageR2: toR2Asset(historyAsset, 'Tarihçemiz'),
      },
      identitySection: {
        title: {
          tr: 'MİMARİ KİMLİK VE TASARIM ANLAYIŞIMIZ',
          en: 'ARCHITECTURAL IDENTITY & DESIGN PHILOSOPHY',
        },
        content: {
          tr: [
            {
              _key: 'id-tr-1',
              _type: 'block',
              style: 'normal',
              children: [
                {
                  _key: 'id-tr-1-span',
                  _type: 'span',
                  text: 'Form ve fonksiyon arasındaki hassas dengeyi korurken, mimari mekanlarla tam uyumlu koleksiyonlar tasarlıyoruz. Her bir parçamız, oranların mükemmelliği ve malzeme dürüstlüğü ile mekanın karakterini yükseltmek üzere kurgulanır.',
                },
              ],
            },
          ],
          en: [
            {
              _key: 'id-en-1',
              _type: 'block',
              style: 'normal',
              children: [
                {
                  _key: 'id-en-1-span',
                  _type: 'span',
                  text: 'While maintaining a delicate balance between form and function, we design collections that harmonise seamlessly with architectural spaces.',
                },
              ],
            },
          ],
        },
        image: toSanityImage(identityAsset),
        imageR2: toR2Asset(identityAsset, 'Mimari Kimlik'),
      },
      qualitySection: {
        title: {
          tr: 'ÜSTÜN ZANAAT VE ÜRETİM KALİTESİ',
          en: 'SUPERIOR CRAFTSMANSHIP & PRODUCTION QUALITY',
        },
        content: {
          tr: [
            {
              _key: 'q-tr-1',
              _type: 'block',
              style: 'normal',
              children: [
                {
                  _key: 'q-tr-1-span',
                  _type: 'span',
                  text: 'Modern üretim parkurumuz ve usta zanaatkarlarımızın el emeği, ürettiğimiz her detayda birleşir. Sürdürülebilir hammadde kullanımı ve uzun ömürlü mühendislik anlayışıyla nesiller boyu yaşayacak mobilyalar üretiyoruz.',
                },
              ],
            },
          ],
          en: [
            {
              _key: 'q-en-1',
              _type: 'block',
              style: 'normal',
              children: [
                {
                  _key: 'q-en-1-span',
                  _type: 'span',
                  text: 'Our modern manufacturing facility combined with the skill of master craftsmen shines through in every detail.',
                },
              ],
            },
          ],
        },
        image: toSanityImage(qualityAsset),
        imageR2: toR2Asset(qualityAsset, 'Üretim Kalitesi'),
      },
    }

    const res = await client.createOrReplace(doc)
    console.log(
      '🎉 TÜM GÖRSELLER SANITY MEDIA DEPOSUNA VE ABOUT PAGE V2 DOKÜMANINA YÜKLENDİ! ID:',
      res._id
    )
  } catch (err) {
    console.error('❌ Hata oluştu:', err)
  }
}

main()
