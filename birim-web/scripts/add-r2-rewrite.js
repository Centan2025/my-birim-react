const fs = require('fs')
const path = require('path')

const srcDir = path.join(__dirname, '../schemaTypes/documents')
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))

files.forEach((file) => {
  const filePath = path.join(srcDir, file)
  let content = fs.readFileSync(filePath, 'utf8')

  // if already modified, skip
  if (content.includes("finalUrl.includes('.r2.dev')")) return

  let hasChanged = false

  const replaceLogic = (match, p1) => {
    hasChanged = true
    return `${p1} {
      let finalUrl = r2Url
      const domain = process.env.SANITY_STUDIO_R2_DOMAIN
      if (finalUrl && domain && finalUrl.includes('.r2.dev') && !domain.includes('.r2.dev')) {
        try {
          const parsed = new URL(finalUrl)
          const path = parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname
          finalUrl = \`\${domain}/\${path}\`
        } catch (e) { }
      }
      return {`
  }

  // match `prepare({ title, r2Url }) { return {`
  content = content.replace(
    /(prepare\(\{\s*title,\s*r2Url\s*\}\))\s*\{\s*return\s*\{/g,
    replaceLogic,
  )

  // match `prepare({ r2Url }) { return {`
  content = content.replace(/(prepare\(\{\s*r2Url\s*\}\))\s*\{\s*return\s*\{/g, replaceLogic)

  // after replacement, we need to change r2Url usage to finalUrl inside the return block
  if (hasChanged) {
    // Find the end of prepare block and replace r2Url inside return object
    const parts = content.split('prepare(')
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].includes('let finalUrl = r2Url')) {
        parts[i] = parts[i]
          .replace(/media:\s*r2Url\s*\?/g, 'media: finalUrl ?')
          .replace(/src=\{r2Url\}/g, 'src={finalUrl}')
      }
    }
    content = parts.join('prepare(')

    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`Updated ${file}`)
  }
})
