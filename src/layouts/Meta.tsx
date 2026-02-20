import Head from 'next/head';
import { useRouter } from 'next/router';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { ST_ROUTES } from '@/constants/ST_ROUTES';
import { AppConfig } from '@/utils/AppConfig';
import { normalizeCanonicalUrl } from '@/utils/canonical';
import { STConfig } from '@/utils/STConfig';

type IMetaProps = {
  readonly title: string;
  readonly description: string;
  readonly canonical?: string;
  readonly og?: string;
  readonly noIndex?: boolean;
};

const Meta = (props: IMetaProps) => {
  const router = useRouter();
  const isSTRoute = ST_ROUTES.includes(router.pathname);
  const isEarnRoute = router.pathname.startsWith('/earn');
  const isDashboardRoute = router.pathname.startsWith('/earn/dashboard');
  const shouldNoIndex = props.noIndex || isDashboardRoute;
  const config = isSTRoute ? STConfig : AppConfig;
  const twitterSite = isSTRoute ? '@Superteam' : '@SuperteamEarn';
  const defaultOg = isSTRoute
    ? `${ASSET_URL}/st/og/og.png`
    : `${ASSET_URL}/og/og.png`;
  const ogImage = props.og ?? defaultOg;
  const normalizedCanonical = props.canonical
    ? normalizeCanonicalUrl(props.canonical)
    : undefined;
  const canonicalForIndexable = shouldNoIndex ? undefined : normalizedCanonical;

  return (
    <Head>
      <title>{props.title}</title>
      <meta charSet="UTF-8" key="charset" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1"
        key="viewport"
      />
      {isEarnRoute ? (
        <>
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
        </>
      ) : (
        <>
          <link
            rel="icon"
            type="image/png"
            href={`${router.basePath}/st-favicon.png`}
            key="icon-png"
          />
        </>
      )}
      <meta name="description" content={props.description} key="description" />
      {shouldNoIndex && (
        <>
          <meta name="robots" content="noindex, nofollow" key="robots" />
          <meta name="googlebot" content="noindex, nofollow" key="googlebot" />
        </>
      )}
      {canonicalForIndexable && (
        <link rel="canonical" href={canonicalForIndexable} key="canonical" />
      )}
      <meta name="theme-color" content="#5522e0" key="theme-color" />
      <meta property="og:title" content={props.title} key="og:title" />
      <meta
        property="og:description"
        content={props.description}
        key="og:description"
      />
      {canonicalForIndexable && (
        <meta property="og:url" content={canonicalForIndexable} key="og:url" />
      )}
      <meta property="og:locale" content={config.locale} key="og:locale" />
      <meta
        property="og:site_name"
        content={config.site_name}
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
      <meta name="twitter:site" content={twitterSite} key="twitter:site" />
      <meta
        name="twitter:creator"
        content={twitterSite}
        key="twitter:creator"
      />
      <meta
        name="twitter:description"
        content={props.description}
        key="twitter:description"
      />
    </Head>
  );
};

export { Meta };
