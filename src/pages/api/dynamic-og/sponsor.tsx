import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

import { fetchAsset, formatString } from '@/utils/ogHelpers';

export const config = {
  runtime: 'edge',
};

const mediumFontP = fetchAsset(
  new URL('../../../../public/Inter-Medium.woff', import.meta.url),
);
const boldFontP = fetchAsset(
  new URL('../../../../public/Inter-Bold.woff', import.meta.url),
);

const logoP = fetchAsset(
  new URL('../../../../public/assets/logo/logo-grayed.png', import.meta.url),
);

export default async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const [mediumFont, boldFont, logo] = await Promise.all([
      mediumFontP,
      boldFontP,
      logoP,
    ]);

    const getParam = (name: any, processFn = (x: any) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const title = getParam('title', (x) => formatString(x, 24));
    const slug = getParam('slug', (x) => formatString(x, 28));
    const sponsorLogo = getParam('logo', (x) => formatString(x, 100));

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '50px 100px',
            background: 'white',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              background: '#F8FAFC',
              position: 'absolute',
              height: '50%',
              width: '200%',
            }}
          ></div>
          <img
            style={{
              width: '108px',
              height: '28px',
              objectFit: 'contain',
              display: 'block',
              marginLeft: 'auto',
            }}
            alt="pfp"
            src={logo as any}
          />
          <div
            style={{
              display: 'flex',
              gap: '54px',
              marginTop: '84px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '276px',
                height: '276px',
                background: 'black',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'contain',
                  background: 'black',
                }}
                alt="logo"
                src={sponsorLogo as string}
              />
            </div>
            <div
              style={{
                alignSelf: 'flex-end',
                paddingBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontStyle: 'normal',
                  color: 'black',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Bold"',
                }}
              >
                {title}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 34,
                  fontStyle: 'normal',
                  color: '#64748B',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Medium"',
                  marginTop: '-8px',
                }}
              >
                @{slug}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 34,
              fontStyle: 'normal',
              alignItems: 'center',
              gap: '8px',
              color: '#64748B',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              fontFamily: '"Medium"',
              marginLeft: 'auto',
              marginTop: '74px',
            }}
          >
            View Opportunities
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="34"
              height="34"
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
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Medium', data: mediumFont, style: 'normal' },
          { name: 'Bold', data: boldFont, style: 'normal' },
        ],
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
