module.exports = {
  extends: ['standard', 'plugin:prettier/recommended', 'prettier/standard'],
  parser: '@typescript-eslint/parser',
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error', require('./.prettierrc.js')]
  },
  ignorePatterns: ['dist'],
  overrides: [
    {
      files: ['**/*.ts'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint'
      ],
      plugins: ['@typescript-eslint'],
      rules: {
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': ['error']
      }
    }
  ]
}
