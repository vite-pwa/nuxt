import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// fix cjs export default
const cjsModule = resolve('dist/module.cjs')
const cjsModuleContent = readFileSync(cjsModule, 'utf-8')
writeFileSync(
  cjsModule,
  cjsModuleContent.replace(
    'module.exports = function',
    'exports.default = function',
  ),
  'utf-8',
)

// fix d.mts imports
const mDtsModule = resolve('dist/types.d.mts')
const mDtsModuleContent = readFileSync(mDtsModule, 'utf-8')
writeFileSync(
  mDtsModule,
  mDtsModuleContent.replaceAll(
    'from \'./module\'',
    'from \'./module.js\'',
  ),
  'utf-8',
)
