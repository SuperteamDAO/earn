/** @type {import('lint-staged').Configuration} */
export default {
  '*.{js,mjs,ts,tsx}': ['oxlint --fix --deny-warnings', 'oxfmt'],
  '*.{ts,tsx}': () => 'pnpm typecheck',
  '*.{json,css,md,yaml}': ['oxfmt'],
};
