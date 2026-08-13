import puppeteer from 'puppeteer-core'

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const screenshotPath =
  'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\88e8fe48-0ff0-4e6e-9f1b-354805ee0723\\scratch\\projects_blueprint.png'

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({width: 1440, height: 900})

  console.log('Navigating to http://localhost:3001/#/projects...')
  await page.goto('http://localhost:3001/#/projects', {waitUntil: 'networkidle2'})
  await new Promise(r => setTimeout(r, 2000))

  // Hover over the first project card to trigger Blueprint Wireframe SVG
  const card = await page.$('a[href*="/projects/"]')
  if (card) {
    await card.hover()
    await new Promise(r => setTimeout(r, 1000))
  }

  await page.screenshot({path: screenshotPath, fullPage: false})
  console.log(`Screenshot saved to: ${screenshotPath}`)

  await browser.close()
}

run().catch(console.error)
