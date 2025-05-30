import { ImageResponse } from 'next/og';

import { Superteams } from '@/constants/Superteam';
import { loadGoogleFont } from '@/utils/ogHelpers';

import 'flag-icons/css/flag-icons.min.css';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const getParam = (name: any, processFn = (x: any) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const region = getParam('region');
    const code = getParam('code');
    const hasCode = code && code !== 'undefined';
    const prefix = 'Find High Paying Crypto Gigs in ';

    const allText = `${prefix || ''}${region || ''}${code || ''}`;

    const [interBold] = await Promise.all([
      loadGoogleFont('Inter:wght@700', allText),
    ]);

    const superteam = Superteams.find((s) => s.displayValue === region);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              height: '40%',
              display: 'flex',
              padding: '40px 50px',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '24px' }}>
              {hasCode && (
                <img
                  src={`https://flagsapi.com/${code}/shiny/64.png`}
                  style={{ height: '72px', width: '72px', marginTop: '12px' }}
                  alt="flag"
                />
              )}
              {region && (
                <p
                  style={{
                    fontSize: 58,
                    fontStyle: 'normal',
                    color: 'black',
                    lineHeight: 1.2,
                    letterSpacing: '-1px',
                    fontFamily: '"Bold"',
                    width: '700px',
                  }}
                >
                  {prefix}
                  <span
                    style={{
                      color: '#6366F1',
                      position: 'absolute',
                      marginLeft: '200px',
                      marginTop: '72px',
                    }}
                  >
                    {region}
                  </span>
                </p>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: '32px',
              }}
            >
              <svg
                width="136"
                height="35"
                viewBox="0 0 136 35"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_29_85)">
                  <path
                    d="M17.6296 35C27.3662 35 35.2593 27.165 35.2593 17.5C35.2593 7.83502 27.3662 0 17.6296 0C7.89305 0 0 7.83502 0 17.5C0 27.165 7.89305 35 17.6296 35Z"
                    fill="#6366F1"
                  />
                  <path
                    d="M23.0851 12.5178H27.0741V14.0362C27.0741 16.0955 25.3855 17.76 23.2965 17.76H23.0851V12.5178ZM17.4082 10.3125H23.0851V24.6458H22.4096C18.2945 24.6458 17.4713 21.8168 17.4713 19.2993L17.4082 10.3125ZM8.18518 13.558C8.18518 16.1166 10.0422 17.053 12.1105 17.365H8.18518V24.6875H11.9629C15.7619 24.6875 16.2048 23.0231 16.2048 21.442C16.2048 19.5071 14.8543 18.1553 12.7646 17.635H16.2048V10.3125H12.4271C8.62857 10.3125 8.18518 11.9769 8.18518 13.558Z"
                    fill="white"
                  />
                  <path
                    d="M58.0977 28.4865C55.7624 28.4865 53.7256 28.0148 51.9876 27.0713C50.2497 26.1278 48.8918 24.834 47.9143 23.1896C46.9366 21.5453 46.4479 19.6585 46.4479 17.529C46.4479 15.8846 46.7195 14.375 47.2625 13.0003C47.8057 11.6255 48.5661 10.4395 49.5436 9.44209C50.5213 8.41777 51.6753 7.63604 53.0059 7.09692C54.3637 6.53085 55.8302 6.2478 57.4053 6.2478C58.8716 6.2478 60.2294 6.51737 61.4786 7.05649C62.7277 7.56865 63.8003 8.30994 64.6966 9.28035C65.6199 10.2238 66.3259 11.3425 66.8146 12.6364C67.3034 13.9303 67.5207 15.3455 67.4664 16.882L67.4256 18.661H50.114L49.1771 15.1433H62.6599L62.0081 15.8711V14.9816C61.9537 14.2537 61.7094 13.5933 61.2749 13.0003C60.8676 12.4073 60.338 11.949 59.6862 11.6255C59.0346 11.3021 58.3014 11.1403 57.4867 11.1403C56.2918 11.1403 55.2734 11.3695 54.4317 11.8277C53.6169 12.286 52.9925 12.9599 52.558 13.8494C52.1234 14.7389 51.9062 15.8172 51.9062 17.0841C51.9062 18.378 52.1777 19.4966 52.7208 20.4401C53.2912 21.3836 54.0787 22.1248 55.0834 22.664C56.1153 23.1761 57.3237 23.4323 58.7087 23.4323C59.6592 23.4323 60.5281 23.284 61.3157 22.9875C62.1032 22.691 62.945 22.1788 63.8411 21.451L66.611 25.2921C65.8235 25.9931 64.9545 26.5861 64.004 27.0713C63.0536 27.5296 62.076 27.88 61.0712 28.1226C60.0665 28.3651 59.0752 28.4865 58.0977 28.4865Z"
                    fill="#0F172A"
                  />
                  <path
                    d="M79.8061 28.4865C78.0138 28.4865 76.3981 28.0013 74.9588 27.0308C73.5196 26.0605 72.379 24.7396 71.5372 23.0683C70.6953 21.3971 70.2744 19.4831 70.2744 17.3266C70.2744 15.1702 70.6953 13.2698 71.5372 11.6255C72.4062 9.95425 73.5738 8.64689 75.0403 7.70344C76.5067 6.73302 78.1767 6.2478 80.0504 6.2478C81.1096 6.2478 82.0736 6.40954 82.9425 6.73302C83.8386 7.02954 84.6126 7.44735 85.2644 7.98647C85.9433 8.52559 86.5135 9.14557 86.9752 9.84644C87.4367 10.5473 87.7626 11.3021 87.9527 12.1107L86.7307 11.9086V6.69259H92.4741V28.0821H86.6493V22.947L87.9527 22.8258C87.7354 23.5805 87.3825 24.2948 86.8938 24.9688C86.4048 25.6426 85.7938 26.2491 85.0606 26.7883C84.3546 27.3005 83.5535 27.7183 82.6574 28.0418C81.7614 28.3383 80.8109 28.4865 79.8061 28.4865ZM81.3947 23.5131C82.481 23.5131 83.4313 23.257 84.246 22.7448C85.0606 22.2326 85.6852 21.5183 86.1197 20.6018C86.5815 19.6585 86.8122 18.5666 86.8122 17.3266C86.8122 16.1137 86.5815 15.0489 86.1197 14.1324C85.6852 13.2159 85.0606 12.5016 84.246 11.9894C83.4313 11.4503 82.481 11.1808 81.3947 11.1808C80.3355 11.1808 79.3988 11.4503 78.584 11.9894C77.7965 12.5016 77.1719 13.2159 76.7104 14.1324C76.2486 15.0489 76.0178 16.1137 76.0178 17.3266C76.0178 18.5666 76.2486 19.6585 76.7104 20.6018C77.1719 21.5183 77.7965 22.2326 78.584 22.7448C79.3988 23.257 80.3355 23.5131 81.3947 23.5131Z"
                    fill="#0F172A"
                  />
                  <path
                    d="M98.2733 28.0821V6.69259H103.854L104.057 13.5664L103.08 12.1512C103.406 11.046 103.935 10.0486 104.668 9.15905C105.402 8.24255 106.257 7.52822 107.235 7.01605C108.239 6.50389 109.285 6.2478 110.371 6.2478C110.833 6.2478 111.281 6.28824 111.715 6.3691C112.15 6.44997 112.516 6.54432 112.815 6.65215L111.267 12.9599C110.941 12.7981 110.548 12.6633 110.086 12.5555C109.624 12.4207 109.149 12.3533 108.66 12.3533C108.009 12.3533 107.398 12.4746 106.827 12.7172C106.284 12.9329 105.809 13.2564 105.402 13.6877C104.994 14.092 104.668 14.5772 104.424 15.1433C104.207 15.7094 104.098 16.3294 104.098 17.0033V28.0821H98.2733Z"
                    fill="#0F172A"
                  />
                  <path
                    d="M116.134 28.0821V6.69259H121.674L121.837 11.0595L120.696 11.5447C120.995 10.5742 121.524 9.69817 122.285 8.91645C123.072 8.10777 124.009 7.46082 125.095 6.97562C126.182 6.49042 127.322 6.2478 128.517 6.2478C130.146 6.2478 131.504 6.57129 132.59 7.21822C133.704 7.86517 134.532 8.84905 135.075 10.1699C135.645 11.4638 135.93 13.0677 135.93 14.9816V28.0821H130.146V15.4263C130.146 14.4559 130.01 13.6472 129.739 13.0003C129.467 12.3533 129.047 11.8816 128.476 11.5851C127.933 11.2616 127.254 11.1268 126.44 11.1808C125.788 11.1808 125.177 11.2886 124.607 11.5042C124.063 11.6929 123.588 11.976 123.181 12.3533C122.801 12.7307 122.488 13.162 122.244 13.6472C122.027 14.1324 121.918 14.6581 121.918 15.2242V28.0821H119.067C118.442 28.0821 117.885 28.0821 117.397 28.0821C116.908 28.0821 116.487 28.0821 116.134 28.0821Z"
                    fill="#0F172A"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M56.3268 9.1798L58.2225 1.02856L63.1305 2.1533L61.2347 10.3045L56.3268 9.1798Z"
                    fill="#0F172A"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M49.8667 32.8467L52.0785 23.3369L56.9864 24.4617L54.7747 33.9715L49.8667 32.8467Z"
                    fill="#0F172A"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_29_85">
                    <rect width="136" height="35" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <div style={{ height: '60%', display: 'flex', width: '100%' }}>
            <img
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              alt="logo"
              src={superteam?.banner || ''}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Bold', data: interBold, style: 'normal' }],
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
