const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'birim-web', 'schemaTypes')

const helperContent = `// Helper to resolve absolute URLs for Sanity Studio previews
export const getPreviewUrl = (url?: string): string => {
  if (!url) return ''
  
  let domain = 'https://assets.birim.com'
  try {
    if (typeof process !== 'undefined' && process.env && process.env.SANITY_STUDIO_R2_DOMAIN) {
      domain = process.env.SANITY_STUDIO_R2_DOMAIN
    }
  } catch (e) {}

  if (url.startsWith('migration/')) {
    return \`\${domain}/\${url}\`.replace(/ /g, '%20')
  }
  
  if (url.includes('.r2.dev') && !domain.includes('.r2.dev')) {
    try {
      const parsed = new URL(url)
      const path = parsed.pathname.startsWith('/')
        ? parsed.pathname.substring(1)
        : parsed.pathname
      return \`\${domain}/\${path}\`.replace(/ /g, '%20')
    } catch (e) {}
  }
  
  return url.replace(/ /g, '%20')
}
`

// create utils folder
const utilsDir = path.join(dir, 'utils')
if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir)
fs.writeFileSync(path.join(utilsDir, 'previewUrl.ts'), helperContent)

function processDir(directory) {
  const files = fs.readdirSync(directory)
  for (const file of files) {
    const fullPath = path.join(directory, file)
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath)
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      if (content.includes('process.env.SANITY_STUDIO_R2_DOMAIN')) {
        let changed = false
        // Determine relative path to utils/previewUrl.ts
        let relPath = path.relative(path.dirname(fullPath), path.join(utilsDir, 'previewUrl')).replace(/\\/g, '/')
        let importPath = relPath.startsWith('.') ? relPath : `./${relPath}`

        // Add import at top
        if (!content.includes('getPreviewUrl')) {
          const lines = content.split('\n')
          let lastImportIdx = -1
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) lastImportIdx = i
          }
          lines.splice(lastImportIdx + 1, 0, `import { getPreviewUrl } from '${importPath}'`)
          content = lines.join('\n')
          changed = true
        }

        // Replace the bulky logic block
        // The block usually starts with: let finalUrl = r2Url (or imageUrl)
        // and ends with: } catch (e) {} }
        const regex1 = /let finalUrl\s*=\s*(r2Url|imageUrl)[\s\S]*?catch\s*\(\w*\)\s*\{\}[\s\S]*?\}/g
        const regex2 = /let finalUrl\s*=\s*(.*?)\s+const domain\s*=\s*process\.env\.SANITY_STUDIO_R2_DOMAIN[\s\S]*?catch\s*\(\w*\)\s*\{\}[\s\S]*?\}/g

        if (regex2.test(content)) {
          content = content.replace(regex2, (match, p1) => {
            return `let finalUrl = getPreviewUrl(${p1.trim()})`
          })
          changed = true
        } else if (regex1.test(content)) {
          content = content.replace(regex1, (match, p1) => {
            return `let finalUrl = getPreviewUrl(${p1.trim()})`
          })
          changed = true
        }

        if (changed) {
          fs.writeFileSync(fullPath, content)
          console.log(`Updated ${fullPath}`)
        }
      }
    }
  }
}

processDir(dir)
console.log('Done.')
