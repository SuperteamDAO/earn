/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://earn.superteam.fun/',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: ['/signup', '/dashboard', '/new/sponsor'],
      },
    ],
  },
};
