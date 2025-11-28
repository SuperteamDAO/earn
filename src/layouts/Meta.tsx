import Head from 'next/head';
import { useRouter } from 'next/router';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { AppConfig } from '@/utils/AppConfig';

type IMetaProps = {
  readonly title: string;
  readonly description: string;
  readonly canonical?: string;
  readonly og?: string;
};

const Meta = (props: IMetaProps) => {
  const router = useRouter();
  const ogImage = props.og ?? `${ASSET_URL}/og/og.png`;

  return (
    <Head>
      <title>{props.title}</title>
      <meta charSet="UTF-8" key="charset" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1"
        key="viewport"
      />
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
      <link rel="icon" href={`${router.basePath}/favicon.ico`} key="favicon" />
      <meta name="description" content={props.description} key="description" />
      {props.canonical && (
        <link rel="canonical" href={props.canonical} key="canonical" />
      )}
      <meta name="theme-color" content="#5522e0" key="theme-color" />
      <meta property="og:title" content={props.title} key="og:title" />
      <meta
        property="og:description"
        content={props.description}
        key="og:description"
      />
      {props.canonical && (
        <meta property="og:url" content={props.canonical} key="og:url" />
      )}
      <meta property="og:locale" content={AppConfig.locale} key="og:locale" />
      <meta
        property="og:site_name"
        content={AppConfig.site_name}
        key="og:site_name"
      />
      <meta property="og:image" content={ogImage} key="og:image" />
      <meta property="og:image:alt" content={props.title} key="og:image:alt" />
      <meta property="og:type" content="website" key="og:type" />
      <meta
        name="twitter:card"
        content="summary_large_image"
        key="twitter:card"
      />
      <meta name="twitter:site" content="@SuperteamEarn" key="twitter:site" />
      <meta
        name="twitter:creator"
        content="@SuperteamEarn"
        key="twitter:creator"
      />
    </Head>
  );
};

export { Meta };
