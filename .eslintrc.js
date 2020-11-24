module.exports = {
  extends: ['standard', 'plugin:prettier/recommended', 'prettier/standard'],
  overrides: [
    {
      files: ['**/*.ts'],
      extends: [
        'standard-with-typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier/@typescript-eslint'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json'
      }
    }
  ],
  plugins: ['prettier'],
  rules: {
    'no-void': ['error', { allowAsStatement: true }],
    'prettier/prettier': ['error', require('./.prettierrc.js')]
  }
}
