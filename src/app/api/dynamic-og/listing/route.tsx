import { ImageResponse } from 'next/og';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { tokenList } from '@/constants/tokenList';
import { formatNumber, formatString, loadGoogleFont } from '@/utils/ogHelpers';
import { getURL } from '@/utils/validUrl';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const bgColors = ['#FFFBEB', '#FAFAF9', '#ECFDF5', '#EFF6FF', '#EEF2FF'];
    const randomIndex = Math.floor(Math.random() * bgColors.length);
    const bgColor = bgColors[randomIndex];

    const getParam = (name: any, processFn = (x: any) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const title = getParam('title', (x) =>
      formatString(decodeURIComponent(x), 100),
    );
    const type = getParam('type');
    const logo =
      getParam('logo', (x) => formatString(x, 100)) ||
      ASSET_URL + '/logo/sponsor-logo.png';
    const reward = getParam('reward', formatNumber);
    const minRewardAsk = getParam('minRewardAsk', formatNumber);
    const maxRewardAsk = getParam('maxRewardAsk', formatNumber);
    const compensationType = getParam('compensationType', (x) => x) || 'fixed';
    const sponsor = getParam('sponsor', (x) => formatString(x, 16));
    const token = getParam('token', (x) => formatString(x, 100));
    const isSponsorVerified = getParam('isSponsorVerified', (x) => x) || false;

    const allText = `${title || ''}${type || ''}${sponsor || ''}${token || ''}${reward || ''}${minRewardAsk || ''}${maxRewardAsk || ''}`;

    const [interMedium, interSemiBold, interBold] = await Promise.all([
      loadGoogleFont('Inter:wght@500', allText),
      loadGoogleFont('Inter:wght@600', allText),
      loadGoogleFont('Inter:wght@700', allText),
    ]);

    let displayReward;
    switch (compensationType) {
      case 'fixed':
        displayReward = reward;
        break;
      case 'range':
        displayReward = `${minRewardAsk} to ${maxRewardAsk}`;
        break;
      case 'variable':
        displayReward = 'Variable';
        break;
    }

    const getTokenIcon = (symbol: any) =>
      tokenList.find((t) => t.tokenSymbol === symbol)?.icon;

    const icon = getTokenIcon(token);

    const capitalizedType = type
      ? type?.charAt(0).toUpperCase() + type?.slice(1).toLowerCase()
      : null;

    const listingIcon = (() => {
      switch (type) {
        case 'bounty':
          return 'bounty-icon.svg';
        case 'project':
          return 'project-icon.svg';
        case 'hackathon':
          return 'hackathon-icon.svg';
        case 'grant':
          return 'grant-icon.svg';
        default:
          return 'bounty-icon.svg';
      }
    })();

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
                  src={`${getURL()}/assets/${listingIcon}`}
                  width="64px"
                  height="64px"
                />
                {capitalizedType && (
                  <div
                    style={{
                      fontSize: 28,
                      marginLeft: '2px',
                      fontStyle: 'normal',
                      lineHeight: 1.4,
                      color: '#94A3B8',
                      fontFamily: '"Medium"',
                    }}
                  >
                    {capitalizedType}
                  </div>
                )}
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
                alignItems: 'center',
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      fontSize: 24,
                      color: '#94A3B8',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      marginLeft: 16,
                      fontFamily: '"Medium"',
                      marginRight: 4,
                    }}
                  >
                    {`By ${sponsor}`}
                  </div>
                  {isSponsorVerified === 'true' && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M14.9213 0.845157C14.7227 0.527804 14.4301 0.28027 14.0842 0.137011C13.7383 -0.00624784 13.3564 -0.0381037 12.9916 0.0458788L10.4024 0.640657C10.1371 0.701649 9.86133 0.701649 9.59598 0.640657L7.00677 0.0458788C6.64196 -0.0381037 6.26004 -0.00624784 5.91417 0.137011C5.56831 0.28027 5.27571 0.527804 5.07711 0.845157L3.66586 3.09754C3.52186 3.32796 3.32745 3.52238 3.09705 3.66783L0.844813 5.07917C0.528028 5.27761 0.280873 5.56975 0.137654 5.91504C-0.0055644 6.26034 -0.0377425 6.64166 0.0455866 7.00607L0.640326 9.59833C0.701094 9.86323 0.701094 10.1385 0.640326 10.4034L0.0455866 12.9942C-0.0380663 13.3588 -0.0060502 13.7404 0.137184 14.086C0.280418 14.4316 0.527755 14.724 0.844813 14.9225L3.09705 16.3339C3.32745 16.4779 3.52186 16.6723 3.6673 16.9027L5.07855 19.1551C5.48464 19.8046 6.25939 20.1257 7.00677 19.9544L9.59598 19.3596C9.86133 19.2986 10.1371 19.2986 10.4024 19.3596L12.993 19.9544C13.3577 20.038 13.7393 20.006 14.0848 19.8628C14.4304 19.7195 14.7228 19.4722 14.9213 19.1551L16.3325 16.9027C16.4765 16.6723 16.6709 16.4779 16.9013 16.3339L19.155 14.9225C19.4721 14.7237 19.7193 14.431 19.8623 14.0851C20.0053 13.7393 20.0369 13.3574 19.9528 12.9927L19.3595 10.4034C19.2985 10.138 19.2985 9.86225 19.3595 9.59689L19.9542 7.00607C20.038 6.6416 20.0062 6.26007 19.8633 5.9145C19.7203 5.56892 19.4732 5.27645 19.1564 5.07773L16.9028 3.66639C16.6727 3.52211 16.4782 3.32764 16.334 3.09754L14.9213 0.845157ZM14.1969 6.78861C14.286 6.62482 14.3081 6.43286 14.2585 6.25313C14.2089 6.0734 14.0916 5.9199 13.9311 5.82493C13.7707 5.72997 13.5797 5.70094 13.3983 5.74396C13.2169 5.78698 13.0592 5.89869 12.9585 6.05558L9.19276 12.4296L6.91893 10.2521C6.85147 10.1829 6.77076 10.1279 6.6816 10.0905C6.59244 10.0531 6.49666 10.0341 6.39997 10.0345C6.30329 10.0349 6.20768 10.0548 6.11885 10.093C6.03002 10.1311 5.94979 10.1868 5.88293 10.2567C5.81608 10.3265 5.76399 10.4091 5.72975 10.4996C5.69551 10.59 5.67983 10.6864 5.68365 10.783C5.68747 10.8796 5.71071 10.9745 5.75198 11.0619C5.79325 11.1493 5.8517 11.2276 5.92386 11.2919L8.85291 14.0988C8.93131 14.1737 9.02562 14.23 9.12882 14.2634C9.23201 14.2968 9.34142 14.3065 9.44887 14.2916C9.55632 14.2768 9.65903 14.2379 9.74933 14.1778C9.83964 14.1178 9.9152 14.0381 9.97039 13.9447L14.1969 6.78861Z"
                        fill="#3B82F6"
                      />
                    </svg>
                  )}
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
          { name: 'Medium', data: interMedium, style: 'normal' },
          { name: 'SemiBold', data: interSemiBold, style: 'normal' },
          { name: 'Bold', data: interBold, style: 'normal' },
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
