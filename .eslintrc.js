module.exports = {
  extends: ['standard', 'plugin:prettier/recommended', 'prettier/standard'],
  overrides: [
    {
      files: ['**/*.ts'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'standard-with-typescript',
        'prettier/@typescript-eslint'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json'
      }
    }
  ],
  rules: {
    'prettier/prettier': ['error', require('./.prettierrc.js')]
  }
}
