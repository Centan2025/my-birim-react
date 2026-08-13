const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
})

async function main() {
  const home = await client.fetch(`*[_type == "homePage"][0]`)
  console.log('=== DIAGNOSING CONTENT BLOCKS ===')

  home.contentBlocks.forEach((b, i) => {
    console.log(`\nBlock ${i} [${b._key}] - Title: ${b.title?.tr || 'N/A'}`)
    console.log('  _type:', b._type)
    console.log('  mediaType:', b.mediaType)
    console.log('  imageR2:', b.imageR2)
    console.log('  position:', b.position)
    console.log('  hasBorder:', b.hasBorder)
    console.log('  borderThickness:', b.borderThickness)
    console.log('  linkUrl:', b.linkUrl)

    // Checks:
    // 1. Does mediaType === 'image' have an imageR2 object?
    if (b.mediaType === 'image' && (!b.imageR2 || !b.imageR2.url)) {
      console.log("  ⚠️ WARNING: mediaType is 'image' but imageR2 is missing or has no url!")
    }
    // 2. Are title and linkText formatted properly with _type: 'localizedString'?
    if (b.title && typeof b.title === 'string') {
      console.log('  ⚠️ WARNING: title is a string instead of a localizedString object!')
    }
    if (b.linkText && typeof b.linkText === 'string') {
      console.log('  ⚠️ WARNING: linkText is a string instead of a localizedString object!')
    }
    // 3. PortableText blocks check
    if (b.description && b.description.tr) {
      b.description.tr.forEach((ptBlock, ptIdx) => {
        if (ptBlock._type === 'cta' && ptBlock.link && !ptBlock.link.startsWith('http')) {
          console.log(
            `  ⚠️ WARNING: CTA link '${ptBlock.link}' inside PortableText is not absolute URL!`
          )
        }
      })
    }
  })
}

main().catch(console.error)
