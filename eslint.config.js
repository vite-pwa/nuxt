import { antfu } from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      '**/build/**',
      '**/dist/**',
      '**/dev-dist/**',
      '**/node_modules/**',
    ],
  },
)
