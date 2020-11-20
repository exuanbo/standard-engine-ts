module.exports = {
  extends: ['standard', 'plugin:prettier/recommended', 'prettier/standard'],
  ignorePatterns: ['dist'],
  overrides: [
    {
      files: ['**/*.ts'],
      extends: [
        'standard-with-typescript',
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
    'prettier/prettier': ['error', require('./.prettierrc.js')]
  }
}
