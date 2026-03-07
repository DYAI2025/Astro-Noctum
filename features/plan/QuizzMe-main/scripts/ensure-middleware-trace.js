// Ensure the Next.js middleware trace file exists for Vercel packaging
// Vercel expects `.next/server/middleware.js.nft.json` to be present when middleware is used.
// Under some build modes the file can be skipped, which results in an ENOENT failure
// during deployment. This script creates a minimal trace file if it is missing.

const fs = require('fs')
const path = require('path')

const serverDir = path.join('.next', 'server')
const nftPath = path.join(serverDir, 'middleware.js.nft.json')

function ensureMiddlewareTrace() {
  if (fs.existsSync(nftPath)) {
    return
  }

  const jsMiddleware = path.join(serverDir, 'middleware.js')
  const mjsMiddleware = path.join(serverDir, 'middleware.mjs')
  const middlewareFile = fs.existsSync(jsMiddleware)
    ? 'middleware.js'
    : fs.existsSync(mjsMiddleware)
      ? 'middleware.mjs'
      : null

  const tracePayload = {
    version: 1,
    files: [],
    reasons: [],
    ...(middlewareFile ? { sources: [middlewareFile] } : {}),
  }

  fs.mkdirSync(serverDir, { recursive: true })
  fs.writeFileSync(nftPath, JSON.stringify(tracePayload, null, 2))
  console.log(`Created missing middleware trace file at ${nftPath}`)
}

ensureMiddlewareTrace()
