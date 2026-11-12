import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    ignores: [
      '**/build/**',
      '**/dist/**',
      '**/dev-dist/**',
      '**/node_modules/**',
      'packages/module/config/**',
      'pnpm-workspace.yaml',
    ],
  },
  {
    // it detects nested arrays wrongly
    files: ['.github/labeler.yml'],
    rules: {
      'yaml/indent': 'off',
    },
  },
)
