module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'eslint'],
  '**/*.ts?(x)': () => 'yarn check-types',
  '*.{json,yaml}': ['prettier --write'],
};
