/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */

module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'eslint'],
  '**/.ts?(x)': () =>
    'NODE_OPTIONS="--max-old-space-size=4096" pnpm check-types',
  '*.{json,yaml}': ['prettier --write'],
};
