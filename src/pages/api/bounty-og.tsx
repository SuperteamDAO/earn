import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

import { tokenList } from '@/constants';

export const config = {
  runtime: 'experimental-edge',
};

const fetchAsset = (url: URL) => fetch(url).then((res) => res.arrayBuffer());

const fontDataP = fetchAsset(
  new URL('../../../public/Inter-SemiBold.woff', import.meta.url),
);

const sponsorImageP = fetchAsset(
  new URL('../../../public/assets/logo/sponsor-logo.png', import.meta.url),
);

export default async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const [fontData, sponsorImg] = await Promise.all([
      fontDataP,
      sponsorImageP,
    ]);

    let paramTitle = searchParams.get('title');
    if (paramTitle) {
      paramTitle = decodeURIComponent(paramTitle);
      paramTitle = encodeURIComponent(paramTitle);

      paramTitle = paramTitle
        .replace(/%20/g, ' ')
        .replace(/%2C/g, ',')
        .replace(/%3A/g, ':');
    }
    const hasTitle = Boolean(paramTitle);
    const title = hasTitle
      ? paramTitle && paramTitle.length > 97
        ? `${paramTitle.slice(0, 97)}...`
        : paramTitle
      : null;

    const type = searchParams.get('type');

    const hasLogo = searchParams.has('logo');
    const logo = hasLogo ? searchParams.get('logo')?.slice(0, 100) : sponsorImg;

    const hasReward = searchParams.has('reward');
    const reward = hasReward
      ? Number(searchParams.get('reward')).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
      : null;

    const hasSponsor = searchParams.has('sponsor');
    const sponsor = hasSponsor
      ? searchParams.get('sponsor')?.slice(0, 100)
      : null;

    const hasToken = searchParams.has('token');
    const token = hasToken ? searchParams.get('token')?.slice(0, 100) : null;

    const getTokenIcon = (symbol: any, tokens: any[]): string | undefined => {
      const itoken = tokens.find((t) => t.tokenSymbol === symbol);
      return itoken?.icon;
    };

    const icon = getTokenIcon(token, tokenList);

    const capitalizedType = type
      ? type?.charAt(0).toUpperCase() + type?.slice(1).toLowerCase()
      : null;

    return new ImageResponse(
      (
        <div
          style={{
            backgroundImage:
              'url(https://earn.superteam.fun/assets/bg/og-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '50px 50px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: 'white',
              height: '100%',
              borderRadius: '15px',
              padding: '45px 65px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                justifyItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  height: '100%',
                  alignItems: 'center',
                }}
              >
                <img
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                  }}
                  alt="logo"
                  src={logo as string}
                  width="64px"
                  height="64px"
                />
                {sponsor && (
                  <div
                    style={{
                      fontSize: 36,
                      fontStyle: 'normal',
                      color: '#94A3B8',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      marginLeft: 16,
                    }}
                  >
                    {sponsor}
                  </div>
                )}
              </div>

              <svg
                width="185"
                height="49"
                viewBox="0 0 185 49"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M23.7697 47.5394C36.8974 47.5394 47.5394 36.8974 47.5394 23.7697C47.5394 10.6421 36.8974 0 23.7697 0C10.6421 0 0 10.6421 0 23.7697C0 36.8974 10.6421 47.5394 23.7697 47.5394Z"
                  fill="#6366F1"
                />
                <path
                  d="M31.1256 17.0025H36.5037V19.0649C36.5037 21.862 34.227 24.1227 31.4102 24.1227H31.1256V17.0025ZM23.4713 14.0071H31.1256V33.4757H30.2145C24.6663 33.4757 23.5564 29.6331 23.5564 26.2137L23.4713 14.0071ZM11.0361 18.4154C11.0361 21.8906 13.5399 23.1624 16.3285 23.5863H11.0361V33.5323H16.1295C21.2517 33.5323 21.8488 31.2716 21.8488 29.1239C21.8488 26.4958 20.028 24.6598 17.2105 23.9529H21.8488V14.0071H16.7555C11.634 14.0071 11.0361 16.2678 11.0361 18.4154Z"
                  fill="white"
                />
                <path
                  d="M78.3316 38.6926C75.1829 38.6926 72.4369 38.0516 70.0937 36.7703C67.7504 35.4887 65.9198 33.7315 64.6014 31.4978C63.2834 29.2644 62.6245 26.7015 62.6245 23.8091C62.6245 21.5756 62.9905 19.5253 63.7228 17.658C64.4552 15.7907 65.4803 14.1797 66.7984 12.825C68.1164 11.4337 69.6724 10.3719 71.4667 9.63965C73.2973 8.87076 75.2745 8.48633 77.398 8.48633C79.375 8.48633 81.2059 8.85246 82.89 9.58472C84.5743 10.2804 86.0205 11.2873 87.2287 12.6053C88.4736 13.8868 89.4256 15.4063 90.0845 17.1637C90.7437 18.9212 91.0365 20.8434 90.9634 22.9304L90.9084 25.3468H67.5671L66.304 20.5688H84.4827L83.6041 21.5573V20.3491C83.5306 19.3605 83.2013 18.4635 82.6153 17.658C82.0663 16.8525 81.3522 16.2301 80.4736 15.7907C79.5947 15.3514 78.6062 15.1317 77.5079 15.1317C75.8967 15.1317 74.5237 15.4429 73.3887 16.0653C72.2903 16.6877 71.4482 17.6031 70.8624 18.8113C70.2767 20.0196 69.9838 21.4841 69.9838 23.205C69.9838 24.9624 70.3498 26.4818 71.0821 27.7633C71.8512 29.0447 72.9128 30.0517 74.2676 30.784C75.6588 31.4796 77.2882 31.8274 79.1555 31.8274C80.4369 31.8274 81.6086 31.6262 82.6703 31.2234C83.7322 30.8204 84.8672 30.1248 86.0754 29.1363L89.8098 34.3536C88.7482 35.3057 87.5765 36.1111 86.2951 36.7703C85.0135 37.3928 83.6954 37.8686 82.3407 38.1982C80.9862 38.5278 79.6496 38.6926 78.3316 38.6926Z"
                  fill="#1E293B"
                />
                <path
                  d="M107.6 38.6926C105.184 38.6926 103.005 38.0334 101.065 36.7154C99.1244 35.3973 97.5866 33.6031 96.4516 31.333C95.3166 29.0632 94.749 26.4635 94.749 23.5345C94.749 20.6054 95.3166 18.0241 96.4516 15.7907C97.6231 13.5207 99.1976 11.7449 101.175 10.4635C103.152 9.14538 105.404 8.48633 107.93 8.48633C109.358 8.48633 110.658 8.70599 111.829 9.14538C113.038 9.54811 114.081 10.1156 114.96 10.8479C115.875 11.5802 116.644 12.4223 117.266 13.3742C117.889 14.3262 118.328 15.3514 118.584 16.4498L116.937 16.1752V9.09045H124.681V38.1433H116.827V31.1685L118.584 31.0037C118.292 32.0289 117.815 32.9991 117.157 33.9145C116.497 34.8298 115.674 35.6535 114.685 36.3858C113.733 37.0814 112.653 37.6489 111.445 38.0883C110.237 38.4911 108.955 38.6926 107.6 38.6926ZM109.742 31.9372C111.207 31.9372 112.488 31.5894 113.587 30.8938C114.685 30.1982 115.527 29.228 116.113 27.983C116.736 26.7015 117.047 25.2187 117.047 23.5345C117.047 21.8869 116.736 20.4406 116.113 19.1958C115.527 17.9509 114.685 16.9806 113.587 16.285C112.488 15.5527 111.207 15.1866 109.742 15.1866C108.314 15.1866 107.051 15.5527 105.953 16.285C104.891 16.9806 104.049 17.9509 103.426 19.1958C102.804 20.4406 102.493 21.8869 102.493 23.5345C102.493 25.2187 102.804 26.7015 103.426 27.983C104.049 29.228 104.891 30.1982 105.953 30.8938C107.051 31.5894 108.314 31.9372 109.742 31.9372Z"
                  fill="#1E293B"
                />
                <path
                  d="M132.5 38.1433V9.09045H140.024L140.299 18.4269L138.981 16.5047C139.42 15.0035 140.134 13.6488 141.123 12.4406C142.111 11.1957 143.264 10.2255 144.582 9.52981C145.937 8.83416 147.347 8.48633 148.811 8.48633C149.434 8.48633 150.038 8.54126 150.624 8.65109C151.209 8.76093 151.704 8.88909 152.107 9.03552L150.02 17.6031C149.58 17.3834 149.05 17.2003 148.427 17.0539C147.805 16.8708 147.164 16.7793 146.505 16.7793C145.626 16.7793 144.802 16.944 144.033 17.2736C143.301 17.5665 142.66 18.0058 142.111 18.5917C141.562 19.1408 141.123 19.7999 140.793 20.5688C140.5 21.3377 140.354 22.1798 140.354 23.0951V38.1433H132.5Z"
                  fill="#1E293B"
                />
                <path
                  d="M156.581 38.1433V9.09045H164.05L164.269 15.0218L162.732 15.6809C163.134 14.3628 163.849 13.1729 164.874 12.111C165.935 11.0127 167.198 10.1339 168.663 9.47488C170.128 8.81586 171.665 8.48633 173.276 8.48633C175.473 8.48633 177.304 8.92569 178.768 9.80441C180.269 10.6831 181.386 12.0195 182.119 13.8136C182.887 15.571 183.272 17.7495 183.272 20.3491V38.1433H175.473V20.9532C175.473 19.6351 175.29 18.5367 174.924 17.658C174.558 16.7793 173.99 16.1386 173.221 15.7358C172.489 15.2964 171.574 15.1134 170.475 15.1866C169.597 15.1866 168.773 15.333 168.004 15.626C167.272 15.8823 166.631 16.2667 166.082 16.7793C165.569 17.2919 165.148 17.8777 164.819 18.5367C164.526 19.1958 164.379 19.9097 164.379 20.6786V38.1433H160.535C159.693 38.1433 158.942 38.1433 158.283 38.1433C157.624 38.1433 157.056 38.1433 156.581 38.1433Z"
                  fill="#1E293B"
                />
                <path
                  d="M81.8081 2.16089L79.252 13.2325"
                  stroke="#1E293B"
                  stroke-width="8.53846"
                />
                <path
                  d="M73.5247 32.4619L70.5425 45.3789"
                  stroke="#1E293B"
                  stroke-width="8.53846"
                />
              </svg>
            </div>
            {title && (
              <div
                style={{
                  fontSize: 48,
                  fontStyle: 'normal',
                  color: 'black',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Inter"',
                }}
              >
                {title}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <hr
                style={{
                  width: '100%',
                  borderColor: '#CBD5E1',
                  borderWidth: '1px',
                  marginTop: '40px',
                  marginBottom: '24px',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  justifyItems: 'center',
                }}
              >
                {title && (
                  <div
                    style={{
                      fontSize: 20,
                      fontStyle: 'normal',
                      color: '#A788FF',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      backgroundColor: '#e9e9ff',
                      borderRadius: '35px',
                      padding: '12px 60px',
                    }}
                  >
                    {capitalizedType}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    height: '100%',
                    alignItems: 'center',
                  }}
                >
                  {icon && (
                    <img
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                      }}
                      alt="token"
                      src={icon as string}
                      width="64px"
                      height="64px"
                    />
                  )}
                  {reward && (
                    <div
                      style={{
                        fontSize: 32,
                        fontStyle: 'normal',
                        color: '#334254',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        fontFamily: '"Inter"',
                        marginLeft: 10,
                        display: 'flex',
                      }}
                    >
                      ${reward}
                    </div>
                  )}
                  {token && (
                    <div
                      style={{
                        fontSize: 32,
                        fontStyle: 'normal',
                        color: '#334254',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        fontFamily: '"Inter"',
                        marginLeft: 10,
                      }}
                    >
                      {token}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'var(--font-sans)', data: fontData, style: 'normal' }],
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
