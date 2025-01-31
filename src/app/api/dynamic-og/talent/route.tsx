import { ImageResponse } from 'next/og';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { formatNumber, formatString, loadGoogleFont } from '@/utils/ogHelpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const getParam = (name: any, processFn = (x: any) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const name = getParam('name', (x) => formatString(x, 24));
    const username = getParam('username', (x) => formatString(x, 28));
    const photo = getParam('photo', (x) => formatString(x, 100));

    const totalEarned = getParam('totalEarned', formatNumber);
    const submissionCount = getParam('submissionCount', formatNumber);
    const winnerCount = getParam('winnerCount', formatNumber);

    const skills = getParam('skills', (x) => JSON.parse(decodeURIComponent(x)));

    const allText = `${name || ''}${username || ''}${totalEarned || ''}${submissionCount || ''}${winnerCount || ''}Skills $ Total Earned Participated Won @${skills?.map((skill: { skills: string }) => skill.skills).join('')}`;

    const [interMedium, interSemiBold, interBold] = await Promise.all([
      loadGoogleFont('Inter:wght@500', allText),
      loadGoogleFont('Inter:wght@600', allText),
      loadGoogleFont('Inter:wght@700', allText),
    ]);

    return new ImageResponse(
      (
        <div
          style={{
            backgroundImage: `url(${ASSET_URL}/og/talent/bg.png)`,
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
              padding: '45px 60px 25px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                }}
              >
                <img
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'contain',
                    borderRadius: '120px',
                  }}
                  alt="pfp"
                  src={photo as string}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      fontSize: 46,
                      fontStyle: 'normal',
                      color: 'black',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      fontFamily: '"Bold"',
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 34,
                      fontStyle: 'normal',
                      color: '#64748B',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      fontFamily: '"SemiBold"',
                      marginTop: '-8px',
                    }}
                  >
                    @{username}
                  </div>
                </div>
              </div>

              <svg
                width="125"
                height="32"
                viewBox="0 0 125 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_29_31)">
                  <path
                    d="M16.2037 32C25.1528 32 32.4074 24.8366 32.4074 16C32.4074 7.16344 25.1528 0 16.2037 0C7.25464 0 0 7.16344 0 16C0 24.8366 7.25464 32 16.2037 32Z"
                    fill="#6366F1"
                  />
                  <path
                    d="M21.2179 11.4449H24.8843V12.8331C24.8843 14.7159 23.3323 16.2377 21.4122 16.2377H21.2179V11.4449ZM16.0002 9.42859H21.2179V22.5333H20.5971C16.8148 22.5333 16.0582 19.9468 16.0582 17.6451L16.0002 9.42859ZM7.52316 12.3959C7.52316 14.7352 9.22997 15.5913 11.131 15.8766H7.52316V22.5714H10.9953C14.4871 22.5714 14.8941 21.0497 14.8941 19.6041C14.8941 17.8351 13.6528 16.5991 11.7322 16.1234H14.8941V9.42859H11.422C7.93069 9.42859 7.52316 10.9503 7.52316 12.3959Z"
                    fill="white"
                  />
                  <path
                    d="M53.3986 26.0448C51.2522 26.0448 49.3801 25.6135 47.7827 24.7509C46.1853 23.8883 44.9373 22.7053 44.0389 21.202C43.1403 19.6986 42.691 17.9735 42.691 16.0265C42.691 14.523 42.9407 13.1429 43.4398 11.886C43.939 10.629 44.638 9.54466 45.5364 8.63277C46.435 7.69625 47.4957 6.98152 48.7187 6.48862C49.9667 5.97107 51.3145 5.71228 52.7622 5.71228C54.1099 5.71228 55.3579 5.95874 56.506 6.45165C57.6542 6.91991 58.64 7.59766 59.4637 8.4849C60.3123 9.3475 60.9613 10.3703 61.4105 11.5533C61.8597 12.7362 62.0594 14.0301 62.0096 15.4349L61.9721 17.0615H46.0606L45.1995 13.8453H57.5918L56.9927 14.5107V13.6974C56.9427 13.032 56.7182 12.4282 56.3188 11.886C55.9444 11.3438 55.4577 10.9248 54.8586 10.629C54.2597 10.3333 53.5858 10.1854 52.837 10.1854C51.7387 10.1854 50.8028 10.3949 50.0292 10.8139C49.2802 11.2329 48.7063 11.849 48.3069 12.6623C47.9076 13.4756 47.7079 14.4614 47.7079 15.6198C47.7079 16.8027 47.9574 17.8255 48.4566 18.6881C48.9809 19.5508 49.7046 20.2284 50.6281 20.7213C51.5765 21.1896 52.6872 21.4238 53.9602 21.4238C54.8338 21.4238 55.6324 21.2882 56.3563 21.0171C57.0801 20.746 57.8538 20.2778 58.6775 19.6123L61.2233 23.1242C60.4995 23.7652 59.7008 24.3073 58.8272 24.7509C57.9537 25.17 57.0551 25.4903 56.1316 25.7121C55.2082 25.9338 54.2971 26.0448 53.3986 26.0448Z"
                    fill="#0F172A"
                  />
                  <path
                    d="M73.3512 26.0448C71.7039 26.0448 70.2188 25.6012 68.896 24.7139C67.5731 23.8267 66.5248 22.6191 65.7511 21.091C64.9773 19.5631 64.5904 17.8132 64.5904 15.8415C64.5904 13.8699 64.9773 12.1324 65.7511 10.629C66.5498 9.10103 67.623 7.90573 68.9708 7.04314C70.3187 6.15591 71.8535 5.71228 73.5758 5.71228C74.5492 5.71228 75.4353 5.86015 76.2339 6.15591C77.0576 6.42701 77.769 6.80901 78.3681 7.30192C78.992 7.79483 79.516 8.36167 79.9404 9.00246C80.3647 9.64324 80.6642 10.3333 80.8389 11.0727L79.7157 10.8878V6.11894H84.9946V25.6751H79.6409V20.9801L80.8389 20.8693C80.6392 21.5593 80.3148 22.2124 79.8656 22.8286C79.4162 23.4447 78.8546 23.9992 78.1807 24.4922C77.5318 24.9604 76.7955 25.3425 75.9719 25.6382C75.1483 25.9093 74.2747 26.0448 73.3512 26.0448ZM74.8113 21.4977C75.8097 21.4977 76.6832 21.2635 77.4319 20.7953C78.1807 20.327 78.7548 19.6739 79.1542 18.8359C79.5785 17.9735 79.7906 16.9752 79.7906 15.8415C79.7906 14.7325 79.5785 13.759 79.1542 12.9211C78.7548 12.0831 78.1807 11.43 77.4319 10.9618C76.6832 10.4689 75.8097 10.2224 74.8113 10.2224C73.8378 10.2224 72.9768 10.4689 72.2279 10.9618C71.5042 11.43 70.9301 12.0831 70.5059 12.9211C70.0815 13.759 69.8693 14.7325 69.8693 15.8415C69.8693 16.9752 70.0815 17.9735 70.5059 18.8359C70.9301 19.6739 71.5042 20.327 72.2279 20.7953C72.9768 21.2635 73.8378 21.4977 74.8113 21.4977Z"
                    fill="#0F172A"
                  />
                  <path
                    d="M90.3247 25.6751V6.11894H95.4538L95.641 12.4035L94.7426 11.1096C95.042 10.0992 95.5287 9.1873 96.2026 8.37399C96.8765 7.53605 97.6628 6.88295 98.5612 6.41468C99.4847 5.94641 100.446 5.71228 101.444 5.71228C101.868 5.71228 102.28 5.74925 102.68 5.82318C103.079 5.89712 103.416 5.98338 103.69 6.08197L102.268 11.849C101.968 11.7011 101.606 11.5779 101.182 11.4793C100.758 11.3561 100.321 11.2945 99.8716 11.2945C99.2727 11.2945 98.7109 11.4054 98.1869 11.6272C97.6876 11.8244 97.2509 12.1201 96.8765 12.5144C96.5021 12.8841 96.2026 13.3277 95.9779 13.8453C95.7784 14.3628 95.6785 14.9297 95.6785 15.5459V25.6751H90.3247Z"
                    fill="#0F172A"
                  />
                  <path
                    d="M106.741 25.6751V6.11894H111.832L111.982 10.1115L110.934 10.5551C111.208 9.66788 111.695 8.8669 112.394 8.15219C113.118 7.41282 113.979 6.82132 114.977 6.37771C115.976 5.9341 117.024 5.71228 118.122 5.71228C119.62 5.71228 120.868 6.00804 121.866 6.59952C122.889 7.19102 123.651 8.09057 124.15 9.2982C124.674 10.4812 124.936 11.9476 124.936 13.6974V25.6751H119.62V14.1041C119.62 13.2168 119.495 12.4775 119.245 11.886C118.996 11.2945 118.609 10.8632 118.085 10.5921C117.586 10.2963 116.962 10.1731 116.213 10.2224C115.614 10.2224 115.052 10.321 114.528 10.5181C114.029 10.6907 113.592 10.9494 113.218 11.2945C112.868 11.6395 112.581 12.0338 112.357 12.4775C112.157 12.9211 112.057 13.4017 112.057 13.9192V25.6751H109.436C108.862 25.6751 108.351 25.6751 107.901 25.6751C107.452 25.6751 107.065 25.6751 106.741 25.6751Z"
                    fill="#0F172A"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M51.7709 8.39293L53.5133 0.940369L58.0243 1.9687L56.2819 9.42126L51.7709 8.39293Z"
                    fill="#0F172A"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M45.8334 30.0314L47.8663 21.3367L52.3773 22.365L50.3444 31.0597L45.8334 30.0314Z"
                    fill="#0F172A"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_29_31">
                    <rect width="125" height="32" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginLeft: '150px',
              }}
            >
              <p
                style={{
                  color: '#64748B',
                  fontFamily: 'Medium',
                  fontSize: '26px',
                }}
              >
                Skills
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {skills?.map((skill: { skills: string }) => (
                  <p
                    key={skills.skills}
                    style={{
                      color: '#475569',
                      fontFamily: 'Medium',
                      fontSize: '22px',
                      backgroundColor: '#F1F5F9',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      margin: '0px',
                    }}
                  >
                    {skill.skills}
                  </p>
                ))}
              </div>
              <hr
                style={{
                  width: '100%',
                  borderColor: '#CBD5E1',
                  borderWidth: '1px',
                  marginTop: '24px',
                  marginBottom: '24px',
                }}
              />
              <div style={{ display: 'flex', gap: '60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <p
                    style={{
                      color: 'Black',
                      fontFamily: 'Medium',
                      fontSize: '28px',
                    }}
                  >
                    ${totalEarned}
                  </p>
                  <p
                    style={{
                      color: '#64748B',
                      fontFamily: 'Medium',
                      fontSize: '28px',
                      marginTop: '-12px',
                    }}
                  >
                    Total Earned
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <p
                    style={{
                      color: 'Black',
                      fontFamily: 'Medium',
                      fontSize: '28px',
                    }}
                  >
                    {submissionCount}
                  </p>
                  <p
                    style={{
                      color: '#64748B',
                      fontFamily: 'Medium',
                      fontSize: '28px',
                      marginTop: '-12px',
                    }}
                  >
                    Participated
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <p
                    style={{
                      color: 'Black',
                      fontFamily: 'Medium',
                      fontSize: '28px',
                    }}
                  >
                    {winnerCount}
                  </p>
                  <p
                    style={{
                      color: '#64748B',
                      fontFamily: 'Medium',
                      fontSize: '28px',
                      marginTop: '-12px',
                    }}
                  >
                    Won
                  </p>
                </div>
              </div>
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
