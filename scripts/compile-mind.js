// scripts/compile-mind.js
// Headless MindAR compiler — reads card images from public/, writes card.mind
// Usage: node scripts/compile-mind.js

const { chromium } = require('playwright-chromium')
const fs = require('fs')
const path = require('path')
const http = require('http')
const { spawn } = require('child_process')

const PUBLIC   = path.resolve(__dirname, '../public')
const OUT_FILE = path.join(PUBLIC, 'card.mind')
const PORT     = 3001

// Cards to compile — ORDER = TARGET INDEX
const CARDS = [
  { index: 0, file: 'card1.jpg' },
  { index: 1, file: 'card2.jpg' },
  { index: 2, file: 'card3.png' },
]

async function waitForServer(port, timeout = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      await new Promise((res, rej) => {
        const req = http.get(`http://localhost:${port}`, r => { r.resume(); res() })
        req.on('error', rej)
        req.setTimeout(1000, () => { req.destroy(); rej(new Error('timeout')) })
      })
      return true
    } catch {
      await new Promise(r => setTimeout(r, 500))
    }
  }
  return false
}

async function main() {
  console.log('🔍 Checking card images...')
  for (const card of CARDS) {
    const p = path.join(PUBLIC, card.file)
    if (!fs.existsSync(p)) {
      console.error(`❌ Missing: public/${card.file}`)
      process.exit(1)
    }
    console.log(`  ✓ public/${card.file}`)
  }

  // Check/start dev server
  let serverProc = null
  const serverAlive = await waitForServer(PORT, 2000)
  if (!serverAlive) {
    console.log(`\n🚀 Starting dev server on port ${PORT}...`)
    serverProc = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      stdio: 'ignore',
    })
    const ok = await waitForServer(PORT, 60000)
    if (!ok) { console.error('❌ Dev server did not start'); process.exit(1) }
    console.log('  ✓ Dev server ready')
  } else {
    console.log(`  ✓ Dev server already running on :${PORT}`)
  }

  console.log('\n🌐 Launching headless browser...')
  const browser = await chromium.launch({
    headless: false,   // real GPU needed — TF.js WebGL backend fails in headless
    args: ['--window-size=600,400'],
  })
  const context = await browser.newContext()
  const page    = await context.newPage()

  // Inject __CARDS__ as server-relative URLs before navigating
  const cardUrls = CARDS.map(c => `http://localhost:${PORT}/${c.file}`)

  await page.addInitScript((urls) => { window.__CARDS__ = urls }, cardUrls)

  page.on('console', msg => {
    const t = msg.text()
    if (t.startsWith('compiling') || t.startsWith('loading') || t.startsWith('done') || t.startsWith('ERROR'))
      process.stdout.write(`  [browser] ${t}\r`)
  })
  page.on('pageerror', err => console.error('  [page error]', err.message))

  console.log('  Opening auto-compiler page...')
  await page.goto(`http://localhost:${PORT}/compiler-auto.html`, { waitUntil: 'load' })

  // Wait up to 3 minutes for compilation to finish
  console.log('\n⚙️  Compiling (this takes 30-90s per image)...')
  await page.waitForFunction(
    () => window.__RESULT__ !== undefined || window.__ERROR__ !== undefined,
    null,
    { timeout: 300000, polling: 1000 }
  )

  const error = await page.evaluate(() => window.__ERROR__)
  if (error) {
    console.error(`\n❌ Compiler error: ${error}`)
    await browser.close()
    if (serverProc) serverProc.kill()
    process.exit(1)
  }

  const resultArr = await page.evaluate(() => window.__RESULT__)
  await browser.close()
  if (serverProc) serverProc.kill()

  const outBuf = Buffer.from(resultArr)
  fs.writeFileSync(OUT_FILE, outBuf)

  console.log(`\n\n✅ Done! ${CARDS.length} targets → public/card.mind (${(outBuf.length / 1024).toFixed(1)} KB)`)
  CARDS.forEach(c => console.log(`   [${c.index}] ${c.file}`))
}

main().catch(err => {
  console.error('\n❌ Failed:', err.message)
  process.exit(1)
})
