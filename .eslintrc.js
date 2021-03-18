module.exports = {
  extends: ['standard', 'plugin:prettier/recommended'],
  overrides: [
    {
      files: ['**/*.ts'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'standard-with-typescript'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json'
      },
      rules: {
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/space-before-function-paren': 'off'
      }
    }
  ]
}
