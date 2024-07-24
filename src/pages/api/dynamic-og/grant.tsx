import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

import { tokenList } from '@/constants';
import { fetchAsset, formatNumber, formatString } from '@/utils/ogHelpers';

export const config = {
  runtime: 'experimental-edge',
};

const sponsorImageP = fetchAsset(
  new URL('../../../../public/assets/logo/sponsor-logo.png', import.meta.url),
);

export default async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const mediumFontP = fetchAsset(
      new URL('../../../../public/Inter-Medium.woff', import.meta.url),
    );
    const semiBoldFontP = fetchAsset(
      new URL('../../../../public/Inter-SemiBold.woff', import.meta.url),
    );
    const boldFontP = fetchAsset(
      new URL('../../../../public/Inter-Bold.woff', import.meta.url),
    );

    const [mediumFont, semiBoldFont, boldFont, sponsorImg] = await Promise.all([
      mediumFontP,
      semiBoldFontP,
      boldFontP,
      sponsorImageP,
    ]);

    const bgColors = ['#FFFBEB', '#FAFAF9', '#ECFDF5', '#EFF6FF', '#EEF2FF'];
    const randomIndex = Math.floor(Math.random() * bgColors.length);
    const bgColor = bgColors[randomIndex];

    const getParam = (name: any, processFn = (x: any) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const title = getParam('title', (x) =>
      formatString(decodeURIComponent(x), 97),
    );
    const logo = getParam('logo', (x) => formatString(x, 100)) || sponsorImg;
    const minReward = getParam('minReward', formatNumber);
    const maxReward = getParam('maxReward', formatNumber);
    const sponsor = getParam('sponsor', (x) => formatString(x, 100));
    const token = getParam('token', (x) => formatString(x, 100));

    const displayReward =
      minReward === '0' ? `Upto ${maxReward}` : `${minReward} - ${maxReward}`;

    const getTokenIcon = (symbol: any) =>
      tokenList.find((t) => t.tokenSymbol === symbol)?.icon;

    const icon = getTokenIcon(token);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
          }}
        >
          <div
            style={{
              backgroundColor: bgColor,
              height: '100%',
              width: '30%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              style={{
                width: '128px',
                height: '128px',
                objectFit: 'contain',
                borderRadius: '12px',
              }}
              alt="logo"
              src={logo as string}
              width="64px"
              height="64px"
            />
          </div>
          <div
            style={{
              backgroundColor: '#ffffff',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              height: '100%',
              width: '70%',
              display: 'flex',
              flexDirection: 'column',
              padding: '80px 80px',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  style={{
                    width: '32px',
                    height: '32px',
                    objectFit: 'contain',
                  }}
                  alt="logo"
                  src={`https://earn.superteam.fun/assets/icons/bank.svg`}
                  width="64px"
                  height="64px"
                />

                <div
                  style={{
                    fontSize: 28,
                    marginLeft: '8px',
                    fontStyle: 'normal',
                    lineHeight: 1.4,
                    color: '#94A3B8',
                    fontFamily: '"Medium"',
                    marginTop: '3px',
                  }}
                >
                  Grants
                </div>
              </div>

              {title && (
                <div
                  style={{
                    fontSize: 54,
                    marginTop: '54px',
                    fontStyle: 'normal',
                    color: 'black',
                    lineHeight: 1.2,
                    letterSpacing: '-1px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: '"Bold"',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {title}
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {icon && (
                  <img
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'contain',
                    }}
                    alt="token"
                    src={icon as string}
                  />
                )}
                {displayReward && (
                  <div
                    style={{
                      fontSize: 32,
                      fontStyle: 'normal',
                      color: '#334254',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      fontFamily: '"SemiBold"',
                      marginLeft: 10,
                      display: 'flex',
                    }}
                  >
                    {displayReward}
                  </div>
                )}
                {token && (
                  <div
                    style={{
                      fontSize: 32,
                      fontStyle: 'normal',
                      color: '#94A3B8',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      fontFamily: '"SemiBold"',
                      marginLeft: 10,
                    }}
                  >
                    {token}
                  </div>
                )}
              </div>
              {sponsor && (
                <div
                  style={{
                    fontSize: 28,
                    color: '#94A3B8',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    marginLeft: 16,
                    fontFamily: '"Medium"',
                  }}
                >
                  {`By ${sponsor}`}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Medium', data: mediumFont, style: 'normal' },
          { name: 'SemiBold', data: semiBoldFont, style: 'normal' },
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
