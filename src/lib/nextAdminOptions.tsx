import { NextAdminOptions } from '@premieroctet/next-admin';

export const options: NextAdminOptions = {
  title: '⚡️ My Admin Page',
  model: {
    /* Your model configuration here */
  },
  pages: {
    '/custom': {
      title: 'Custom page',
      icon: 'AdjustmentsHorizontalIcon',
    },
  },
  externalLinks: [
    {
      label: 'App Router',
      url: '/',
    },
  ],
  sidebar: {
    groups: [
      {
        title: 'Users',
        className: ' bg-green-600 p-2 rounded-md', // group title extra classes. (optional)
        models: ['User'],
      },
      {
        title: 'Categories',
        models: ['Category'],
      },
    ],
  },
};
