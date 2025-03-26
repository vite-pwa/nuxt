import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    ignores: [
      '**/build/**',
      '**/dist/**',
      '**/dev-dist/**',
      '**/node_modules/**',
    ],
  },
)
