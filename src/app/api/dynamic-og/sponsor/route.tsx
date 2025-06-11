import { ImageResponse } from 'next/og';

import { formatString, loadGoogleFont } from '@/utils/ogHelpers';
import { getURL } from '@/utils/validUrl';

// Shared layout data structure
function getLayoutData(
  title: string | null,
  slug: string | null,
  sponsorLogo: string | null,
  bannerSrc: string,
) {
  return {
    title: title || 'No Title',
    slug: slug || 'no-slug',
    sponsorLogo,
    bannerSrc: `${bannerSrc}?w=1200`,
    appLogo: `${getURL()}/assets/logo.svg`,
  };
}

// Shared JSX layout for ImageResponse
function getImageLayout(data: ReturnType<typeof getLayoutData>) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          position: 'relative',
        }}
      >
        <img
          style={{
            width: '100%',
            objectFit: 'contain',
            display: 'flex',
            marginLeft: 'auto',
          }}
          alt="banner"
          src={data.bannerSrc}
        />
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '0%',
            transform: 'translate(10%, -20%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            style={{
              width: '150px',
              height: '150px',
              background: 'white',
              objectFit: 'contain',
              borderRadius: '12px',
              border: '4px solid white',
            }}
            alt="sponsor logo"
            src={data.sponsorLogo as string}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginLeft: '32px',
              marginTop: '24px',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontStyle: 'normal',
                width: '100%',
                color: 'black',
                display: 'flex',
                lineHeight: 1.2,
                fontFamily: '"Bold"',
                marginBottom: '8px',
              }}
            >
              {data.title}
            </div>
            <div
              style={{
                fontSize: 24,
                fontStyle: 'normal',
                width: '100%',
                color: '#64748B',
                lineHeight: 1.2,
                display: 'flex',
                whiteSpace: 'pre-wrap',
                fontFamily: '"Medium"',
              }}
            >
              @{data.slug}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 50px 50px 50px',
          flex: 1,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 'auto',
          }}
        >
          <img
            style={{
              width: '108px',
              height: '28px',
              objectFit: 'contain',
            }}
            alt="app logo"
            src={data.appLogo}
          />

          <div
            style={{
              display: 'flex',
              fontSize: 32,
              fontStyle: 'normal',
              alignItems: 'center',
              gap: '8px',
              color: '#64748B',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              fontFamily: '"Medium"',
            }}
          >
            View Opportunities
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const getParam = (name: any, processFn = (x: any) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const title = getParam('title', (x) => formatString(x, 24));
    const slug = getParam('slug', (x) => formatString(x, 28));
    const sponsorLogo = getParam('logo', (x) => formatString(x, 100));
    const banner = getParam('banner', (x) => formatString(x, 200));

    const bannerSrc = banner || `${getURL()}/icons/bg/sponsor-cover/Banner.svg`;

    const layoutData = getLayoutData(title, slug, sponsorLogo, bannerSrc);

    const allText = `${title || ''}${slug || ''}View Opportunities@`;
    const [interMedium, interBold] = await Promise.all([
      loadGoogleFont('Inter:wght@500', allText),
      loadGoogleFont('Inter:wght@700', allText),
    ]);

    return new ImageResponse(getImageLayout(layoutData), {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Medium', data: interMedium, style: 'normal' },
        { name: 'Bold', data: interBold, style: 'normal' },
      ],
    });
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
