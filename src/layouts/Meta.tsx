import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { useEffect, useState } from 'react';

import { AppConfig } from '@/utils/AppConfig';

type IMetaProps = {
  title: string;
  description: string;
  canonical?: string;
  og?: string;
};

const Meta = (props: IMetaProps) => {
  const router = useRouter();
  const [viewport, setViewport] = useState(
    'width=device-width, initial-scale=1',
  );

  useEffect(() => {
    if (navigator.userAgent.indexOf('iPhone') > -1) {
      setViewport('width=device-width, initial-scale=1, maximum-scale=1');
    }
  }, []);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" key="charset" />
        <meta name="viewport" content={viewport} key="viewport" />
        <link
          rel="apple-touch-icon"
          href={`${router.basePath}/apple-touch-icon.png`}
          key="apple"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${router.basePath}/favicon-32x32.png`}
          key="icon32"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${router.basePath}/favicon-16x16.png`}
          key="icon16"
        />
        <link
          rel="icon"
          href={`${router.basePath}/favicon.ico`}
          key="favicon"
        />
      </Head>
      <NextSeo
        title={`${props.title}`}
        description={props.description}
        canonical={props.canonical}
        themeColor="#5522e0"
        openGraph={{
          title: props.title,
          description: props.description,
          url: props.canonical,
          locale: AppConfig.locale,
          site_name: AppConfig.site_name,
          images: [
            {
              url: props.og ?? `${router.basePath}/assets/og/og.png`,
              alt: props.title,
            },
          ],
        }}
        twitter={{
          handle: '@SuperteamEarn',
          site: '@SuperteamEarn',
          cardType: 'summary_large_image',
        }}
      />
    </>
  );
};

export { Meta };
