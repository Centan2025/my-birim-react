import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'birim-web';

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('R2 credentials missing!');
  process.exit(1);
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function isJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

async function fetchSanity(query) {
  const url = `https://wn3a082f.api.sanity.io/v2025-01-01/data/query/production?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result;
}

async function run() {
  console.log('🔍 Scanning CMS for all fake WebP files...');
  const results = await fetchSanity(`{
    "products": *[_type == "product"]{
      _id, name,
      media[]{ imageR2{ url }, imageMobileR2{ url }, imageDesktopR2{ url } },
      dimensionImages[]{ imageR2{ url } },
      bottomMedia[]{ imageR2{ url } },
      exclusiveContent{ images[]{ url } }
    },
    "categories": *[_type == "category"]{
      _id, name, heroImageR2{ url }, menuImageR2{ url }
    },
    "designers": *[_type == "designer"]{
      _id, name, imageR2{ url }, imageMobileR2{ url }, imageDesktopR2{ url }
    },
    "projects": *[_type == "project"]{
      _id, title, media[]{ imageR2{ url }, imageMobileR2{ url }, imageDesktopR2{ url } }
    },
    "materials": *[_type == "materialGroup"]{
      _id, title, books[]{ title, items[]{ name, imageR2{ url } } }
    },
    "news": *[_type == "newsItem"]{
      _id, title, mainImageR2{ url }, mainImageMobileR2{ url }, mainImageDesktopR2{ url }
    }
  }`);

  const allUrls = new Set();
  function addUrl(u) {
    if (u && typeof u === 'string' && u.includes('.webp') && !allUrls.has(u)) {
      allUrls.add(u);
    }
  }

  results.products?.forEach(p => {
    p.media?.forEach(m => { addUrl(m.imageR2?.url); addUrl(m.imageMobileR2?.url); addUrl(m.imageDesktopR2?.url); });
    p.dimensionImages?.forEach(d => addUrl(d.imageR2?.url));
    p.bottomMedia?.forEach(b => addUrl(b.imageR2?.url));
    p.exclusiveContent?.images?.forEach(e => addUrl(e.url));
  });
  results.categories?.forEach(c => { addUrl(c.heroImageR2?.url); addUrl(c.menuImageR2?.url); });
  results.designers?.forEach(d => { addUrl(d.imageR2?.url); addUrl(d.imageMobileR2?.url); addUrl(d.imageDesktopR2?.url); });
  results.projects?.forEach(p => {
    p.media?.forEach(m => { addUrl(m.imageR2?.url); addUrl(m.imageMobileR2?.url); addUrl(m.imageDesktopR2?.url); });
  });
  results.materials?.forEach(g => {
    g.books?.forEach(b => b.items?.forEach(i => addUrl(i.imageR2?.url)));
  });
  results.news?.forEach(n => {
    addUrl(n.mainImageR2?.url); addUrl(n.mainImageMobileR2?.url); addUrl(n.mainImageDesktopR2?.url);
  });

  const urlList = Array.from(allUrls);
  console.log(`Total URLs to verify: ${urlList.length}`);

  const fakeWebpList = [];
  const chunkSize = 25;
  for (let i = 0; i < urlList.length; i += chunkSize) {
    const chunk = urlList.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async u => {
      try {
        const res = await fetch(u, { headers: { Range: 'bytes=0-15' } });
        if (!res.ok) return;
        const buf = Buffer.from(await res.arrayBuffer());
        if (isJpeg(buf)) {
          fakeWebpList.push(u);
        }
      } catch (e) {}
    }));
  }

  console.log(`\n🚀 Starting conversion for ${fakeWebpList.length} fake WebP files to 100% Quality Genuine WebP...`);

  let converted = 0;
  let failed = 0;

  for (let i = 0; i < fakeWebpList.length; i++) {
    const u = fakeWebpList[i];
    try {
      const parsedUrl = new URL(u);
      let key = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));
      if (key.startsWith('birim-web/')) {
        key = key.replace('birim-web/', '');
      }

      const res = await fetch(u);
      if (!res.ok) throw new Error(`Fetch HTTP ${res.status}`);
      const rawBuffer = Buffer.from(await res.arrayBuffer());

      if (!isJpeg(rawBuffer)) {
        console.log(`Skipping [${i + 1}/${fakeWebpList.length}]: Not JPEG (${u})`);
        continue;
      }

      // Convert to genuine 100% quality WebP
      const webpBuffer = await sharp(rawBuffer)
        .webp({ quality: 100, effort: 6 })
        .toBuffer();

      // Upload to R2 overwriting the key
      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: webpBuffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );

      converted++;
      if (converted % 10 === 0 || converted === fakeWebpList.length) {
        console.log(`✅ Converted [${converted}/${fakeWebpList.length}]: ${key} (${rawBuffer.length} -> ${webpBuffer.length} bytes)`);
      }
    } catch (err) {
      failed++;
      console.error(`❌ Failed [${i + 1}/${fakeWebpList.length}] for ${u}:`, err.message);
    }
  }

  console.log(`\n🎉 Repair Finished! Converted: ${converted}, Failed: ${failed}`);
}

run().catch(console.error);
