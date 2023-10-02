import Head from 'next/head';

import type { SeoPropsType } from '../../interface/seo';

const SEO = ({
  title,
  description,
  image,
  name,
  twitterHandle,
  domain,
}: SeoPropsType) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="image" content={image} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://${domain}/`} />
      <meta property="og:site_name" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={description} />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
};

export default SEO;
