import { createClient } from '@sanity/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_DOMAIN = process.env.VITE_R2_DOMAIN

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID
const SANITY_DATASET = process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'production'
const SANITY_TOKEN = process.env.SANITY_TOKEN || process.env.VITE_SANITY_TOKEN

if (!SANITY_TOKEN || !R2_ACCESS_KEY_ID) {
    console.error('❌ Mising environment variables. Please configure .env.local')
    console.error('Missing: ', {
        SANITY_TOKEN: !!SANITY_TOKEN,
        R2_ACCESS_KEY_ID: !!R2_ACCESS_KEY_ID,
        R2_ACCOUNT_ID: !!R2_ACCOUNT_ID
    })
    process.exit(1)
}

// 1. Sanity Client
const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    token: SANITY_TOKEN,
    useCdn: false,
})

// 2. R2 Client
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
})

const BUCKET_NAME = R2_BUCKET_NAME || 'mobilya-assets'
const R2_PUBLIC_DOMAIN = R2_DOMAIN

// Helper: Download Image
const downloadImage = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${res.statusCode}`))
                return
            }
            const data = []
            res.on('data', (chunk) => data.push(chunk))
            res.on('end', () => resolve(Buffer.concat(data)))
            res.on('error', reject)
        })
    })
}

// Helper: Upload to R2
const uploadToR2 = async (buffer, key, mimeType) => {
    try {
        await r2.send(
            new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
            })
        )
        return `${R2_PUBLIC_DOMAIN}/${key}` // Note: This is the URL structure we might want to store, or just the path
    } catch (error) {
        console.error(`Error uploading ${key}:`, error)
        throw error
    }
}

// Helper: Get Sanity Image Details
const getSanityImageDetails = async (imageRef) => {
    if (!imageRef?.asset?._ref) return null
    const assetId = imageRef.asset._ref
    // Sanity asset ID format: image-hash-widthxheight-fmt
    const parts = assetId.split('-')
    const dims = parts[2].split('x')
    const ext = parts[3]

    // Fetch full URL
    const query = `*[_id == "${assetId}"][0].url`
    const url = await client.fetch(query)

    return {
        url,
        width: parseInt(dims[0]),
        height: parseInt(dims[1]),
        extension: ext,
        mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`
    }
}

// Process Single Image Field
// Returns the r2Asset object if successful, or null
const processImageField = async (docId, fieldName, sanityImage, existingR2Asset) => {
    if (!sanityImage?.asset?._ref) return null // No image
    if (existingR2Asset?.url) return null // Already migrated

    console.log(`Processing ${fieldName} for doc ${docId}...`)

    try {
        const details = await getSanityImageDetails(sanityImage)
        if (!details) return null

        const buffer = await downloadImage(details.url)
        const timestamp = Date.now()
        const r2Key = `migration/${docId}/${fieldName}-${timestamp}.${details.extension}`

        // Upload
        await uploadToR2(buffer, r2Key, details.mimeType)

        // Return new asset object
        return {
            _type: 'r2Asset',
            url: `${R2_PUBLIC_DOMAIN}/${r2Key}`,
            path: r2Key, // Storing path is useful for Cloudflare Image Resizing API (/cdn-cgi/image/...)
            width: details.width,
            height: details.height,
            mimeType: details.mimeType,
            alt: sanityImage.alt || '', // Preserve alt if it exists on the image object (custom schema usually puts alt on the object enveloping the image, but sometimes on the image itself if using fields)
        }
    } catch (error) {
        console.error(`Failed to process ${fieldName}:`, error)
        return null
    }
}

// MIGRATORS for specific types

// 1. PRODUCTS
const migrateProducts = async () => {
    console.log('--- Migrating Products ---')
    const products = await client.fetch('*[_type == "product"]')

    for (const product of products) {
        const patch = client.patch(product._id)
        let hasChanges = false

        // Main Images
        const mainImageR2 = await processImageField(product._id, 'mainImage', product.mainImage, product.mainImageR2)
        if (mainImageR2) { patch.set({ mainImageR2 }); hasChanges = true }

        const mobileR2 = await processImageField(product._id, 'mainImageMobile', product.mainImageMobile, product.mainImageMobileR2)
        if (mobileR2) { patch.set({ mainImageMobileR2: mobileR2 }); hasChanges = true }

        const desktopR2 = await processImageField(product._id, 'mainImageDesktop', product.mainImageDesktop, product.mainImageDesktopR2)
        if (desktopR2) { patch.set({ mainImageDesktopR2: desktopR2 }); hasChanges = true }

        // Alternative Media (array)
        // alternativeMedia types: productSimpleMediaItem
        if (product.alternativeMedia && Array.isArray(product.alternativeMedia)) {
            const newMedia = [...product.alternativeMedia]
            let arrayChanged = false
            for (let i = 0; i < newMedia.length; i++) {
                const item = newMedia[i]
                if (item.type === 'image') {
                    const imgR2 = await processImageField(product._id, `alternativeMedia_${i}_image`, item.image, item.imageR2)
                    if (imgR2) { item.imageR2 = imgR2; arrayChanged = true }

                    const mobR2 = await processImageField(product._id, `alternativeMedia_${i}_mobile`, item.imageMobile, item.imageMobileR2)
                    if (mobR2) { item.imageMobileR2 = mobR2; arrayChanged = true }

                    const deskR2 = await processImageField(product._id, `alternativeMedia_${i}_desktop`, item.imageDesktop, item.imageDesktopR2)
                    if (deskR2) { item.imageDesktopR2 = deskR2; arrayChanged = true }
                }
            }
            if (arrayChanged) { patch.set({ alternativeMedia: newMedia }); hasChanges = true }
        }

        // Media (lower panels) (array)
        // media types: productPanelMediaItem
        if (product.media && Array.isArray(product.media)) {
            const newMedia = [...product.media]
            let arrayChanged = false
            for (let i = 0; i < newMedia.length; i++) {
                const item = newMedia[i]
                if (item.type === 'image') {
                    const imgR2 = await processImageField(product._id, `media_${i}_image`, item.image, item.imageR2)
                    if (imgR2) { item.imageR2 = imgR2; arrayChanged = true }

                    const mobR2 = await processImageField(product._id, `media_${i}_mobile`, item.imageMobile, item.imageMobileR2)
                    if (mobR2) { item.imageMobileR2 = mobR2; arrayChanged = true }

                    const deskR2 = await processImageField(product._id, `media_${i}_desktop`, item.imageDesktop, item.imageDesktopR2)
                    if (deskR2) { item.imageDesktopR2 = deskR2; arrayChanged = true }
                }
            }
            if (arrayChanged) { patch.set({ media: newMedia }); hasChanges = true }
        }

        // Dimension Images (array)
        if (product.dimensionImages && Array.isArray(product.dimensionImages)) {
            const newDims = [...product.dimensionImages]
            let arrayChanged = false
            for (let i = 0; i < newDims.length; i++) {
                // productDimensionImage
                const item = newDims[i]
                const imgR2 = await processImageField(product._id, `dim_${i}_image`, item.image, item.imageR2)
                if (imgR2) { item.imageR2 = imgR2; arrayChanged = true }
                // ... mobile/desktop
            }
            if (arrayChanged) { patch.set({ dimensionImages: newDims }); hasChanges = true }
        }

        // Exclusive Content
        if (product.exclusiveContent?.images) {
            const ec = { ...product.exclusiveContent }
            if (!ec.imagesR2) ec.imagesR2 = []
            let changed = false
            // This is an array of images directly: [{type:'image'}]
            // But r2Asset is an object.
            // Strategy: We need to parallel the 'images' array with 'imagesR2'. 
            // Or we should have defined 'imagesR2' as array of r2Asset. We did.

            // We will loop through images, and fill imagesR2 at the same index if missing.
            for (let i = 0; i < ec.images.length; i++) {
                if (!ec.imagesR2[i]) {
                    const imgR2 = await processImageField(product._id, `exclusive_${i}`, ec.images[i], null)
                    if (imgR2) {
                        ec.imagesR2[i] = imgR2
                        changed = true
                    }
                }
            }
            if (changed) { patch.set({ exclusiveContent: ec }); hasChanges = true }
        }

        if (hasChanges) {
            console.log(`Updating product ${product.name?.tr || product._id}`)
            await patch.commit()
        }
    }
}

// 2. SITE SETTINGS
const migrateSiteSettings = async () => {
    console.log('--- Migrating Site Settings ---')
    const doc = await client.fetch('*[_type == "siteSettings"][0]')
    if (!doc) return

    const patch = client.patch(doc._id)
    let changed = false

    const logoR2 = await processImageField(doc._id, 'logo', doc.logo, doc.logoR2)
    if (logoR2) { patch.set({ logoR2 }); changed = true }

    if (changed) await patch.commit()
}

// 3. HOME PAGE
const migrateHomePage = async () => {
    console.log('--- Migrating Home Page ---')
    const doc = await client.fetch('*[_type == "homePage"][0]')
    if (!doc) return

    const patch = client.patch(doc._id)
    let changed = false

    // Inspiration Section
    if (doc.inspirationSection) {
        const insp = { ...doc.inspirationSection }
        let inspChanged = false

        // Check if we defined R2 fields on inspirationSection (inline object) or directly on doc?
        // In homePage.ts, inspirationSection is an object type with fields.
        // So we need to update `inspirationSection.backgroundImageR2`

        const bgR2 = await processImageField(doc._id, 'insp_bg', insp.backgroundImage, insp.backgroundImageR2)
        if (bgR2) { insp.backgroundImageR2 = bgR2; inspChanged = true }

        const mobR2 = await processImageField(doc._id, 'insp_bg_mob', insp.backgroundImageMobile, insp.backgroundImageMobileR2)
        if (mobR2) { insp.backgroundImageMobileR2 = mobR2; inspChanged = true }

        const deskR2 = await processImageField(doc._id, 'insp_bg_desk', insp.backgroundImageDesktop, insp.backgroundImageDesktopR2)
        if (deskR2) { insp.backgroundImageDesktopR2 = deskR2; inspChanged = true }

        if (inspChanged) { patch.set({ inspirationSection: insp }); changed = true }
    }

    // Hero Media
    if (doc.heroMedia && Array.isArray(doc.heroMedia)) {
        const newHero = [...doc.heroMedia]
        let heroChanged = false
        for (let i = 0; i < newHero.length; i++) {
            const item = newHero[i]
            if (item.type === 'image') {
                const imgR2 = await processImageField(doc._id, `hero_${i}`, item.image, item.imageR2)
                if (imgR2) { item.imageR2 = imgR2; heroChanged = true }

                const mobR2 = await processImageField(doc._id, `hero_${i}_mob`, item.imageMobile, item.imageMobileR2)
                if (mobR2) { item.imageMobileR2 = mobR2; heroChanged = true }

                const deskR2 = await processImageField(doc._id, `hero_${i}_desk`, item.imageDesktop, item.imageDesktopR2)
                if (deskR2) { item.imageDesktopR2 = deskR2; heroChanged = true }
            }
        }
        if (heroChanged) { patch.set({ heroMedia: newHero }); changed = true }
    }

    if (changed) await patch.commit()
}

// MAIN EXECUTION
const main = async () => {
    try {
        console.log('Starting Migration...')
        await migrateSiteSettings()
        await migrateHomePage()
        await migrateProducts()
        // Add other types (contactPage, footer) if needed similarly
        console.log('Migration Complete!')
    } catch (err) {
        console.error('Migration Failed:', err)
    }
}

main()
