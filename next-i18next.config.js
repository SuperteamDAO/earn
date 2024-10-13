module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    localeDetection: true, // 设置为 true 可以启用自动语言检测
  },
  localePath: './public/translations',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
