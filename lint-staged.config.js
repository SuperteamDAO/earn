/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */

module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'eslint'],
  '**/*.ts?(x)': (filenames) =>
    `NODE_OPTIONS="--max-old-space-size=4096" tsc --noEmit ${filenames.join(' ')}`,
  '*.{json,yaml}': ['prettier --write'],
};
