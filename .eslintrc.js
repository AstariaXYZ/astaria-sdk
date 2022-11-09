module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  root: true,
  extends: ['prettier/@typescript-eslint', 'plugin:prettier/recommended'],
}
