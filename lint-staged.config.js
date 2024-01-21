module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'eslint'],
  '**/*.ts?(x)': () => 'pnpm check-types',
  '*.{json,yaml}': ['prettier --write'],
};
