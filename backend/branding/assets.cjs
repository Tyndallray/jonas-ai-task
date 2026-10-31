// Managed Login assets, built from the frontend favicon so the sign-in pages and the app share one logo
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const logo = readFileSync(join(__dirname, '../../frontend/public/favicon.svg')).toString('base64')

module.exports = () => [
  { Category: 'FORM_LOGO', ColorMode: 'DYNAMIC', Extension: 'SVG', Bytes: logo },
  { Category: 'FAVICON_SVG', ColorMode: 'DYNAMIC', Extension: 'SVG', Bytes: logo },
]
