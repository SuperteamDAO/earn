/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */

module.exports = {
  '*.{js,jsx,ts,tsx}': ['oxlint --fix --quiet', 'oxfmt --write'],
  '**/*.ts?(x)': () => 'pnpm check-types',
  '*.{json,yaml,yml}': ['oxfmt --write'],
};
