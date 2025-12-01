import { ImageResponse } from 'next/og';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { convertToJpegUrl } from '@/utils/cloudinary';
import { formatNumber, formatString, loadGoogleFont } from '@/utils/ogHelpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const getParam = (name: any, processFn = (x: any) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const name = getParam('name', (x) => formatString(x, 24));
    const username = getParam('username', (x) => formatString(x, 28));
    const photo = getParam('photo', (x) => convertToJpegUrl(x));

    const totalEarned = getParam('totalEarned', formatNumber);

    const allText = `${name || ''}${username || ''}${totalEarned || ''}`;

    const [interRegular, interMedium] = await Promise.all([
      loadGoogleFont('Inter:wght@400', allText),
      loadGoogleFont('Inter:wght@500', allText),
    ]);

    return new ImageResponse(
      (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundImage: `url(${ASSET_URL}/pro/og.png)`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100%',
            width: '100%',
            padding: '0px 60px 25px 116px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '100px',
              zIndex: 0,
              width: '200px',
              height: '200px',
              borderRadius: '9999px',
              backgroundColor: '#3D3D3D',
              filter: 'blur(100px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '0px',
              zIndex: 0,
              bottom: '0px',
              width: '200px',
              height: '200px',
              borderRadius: '9999px',
              backgroundColor: '#3D3D3D',
              filter: 'blur(180px)',
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginTop: '164px',
            }}
          >
            {photo ? (
              <img
                style={{
                  width: '160px',
                  height: '160px',
                  objectFit: 'cover',
                  borderRadius: '160px',
                }}
                alt="pfp"
                src={photo}
              />
            ) : (
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '160px',
                  backgroundColor: '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  color: '#9CA3AF',
                }}
              >
                {name?.[0]?.toUpperCase() +
                  (name.split(' ')?.[1]?.[0]?.toUpperCase() || '') || '?'}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#6161615C',
                    borderRadius: '9999px',
                    padding: '8px 16px',
                    gap: '6px',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 8 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.90271 7.78565C3.77992 7.78565 3.67614 7.69673 3.6464 7.57761C3.55162 7.19795 3.37019 6.79418 3.10209 6.3664C2.78445 5.85274 2.33164 5.3763 1.74366 4.93699C1.23227 4.55048 0.720877 4.28689 0.209488 4.14628C0.088369 4.113 0 4.0056 0 3.87998C0 3.75683 0.0849698 3.65067 0.203389 3.61686C0.704776 3.4737 1.18779 3.24128 1.65242 2.91962C2.18633 2.54791 2.63239 2.10185 2.99058 1.58146C3.30745 1.11788 3.52498 0.659397 3.64315 0.206011C3.6741 0.0872362 3.77867 0 3.90143 0C4.02553 0 4.13083 0.0891682 4.16104 0.209562C4.22924 0.481363 4.33583 0.759568 4.48079 1.04417C4.66329 1.3956 4.89643 1.73352 5.1803 2.05793C5.47089 2.37557 5.79532 2.6628 6.1535 2.91962C6.62157 3.25141 7.09739 3.48451 7.58104 3.61892C7.69969 3.65189 7.78565 3.75752 7.78565 3.88065C7.78565 4.00564 7.69708 4.11214 7.57656 4.14519C7.27 4.22924 6.95445 4.36479 6.62998 4.55176C6.23798 4.78155 5.87302 5.05526 5.53509 5.37291C5.19719 5.68379 4.9201 6.01157 4.70381 6.35624C4.43521 6.78492 4.25357 7.1918 4.15897 7.57695C4.12962 7.69642 4.02568 7.78565 3.90271 7.78565Z"
                      fill="#767676"
                    />
                  </svg>
                  <div
                    style={{
                      fontSize: 18,
                      fontStyle: 'normal',
                      color: 'white',
                      fontFamily: '"Medium"',
                      fontWeight: 500,
                    }}
                  >
                    PRO
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 54,
                  fontStyle: 'normal',
                  color: 'white',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Medium"',
                }}
              >
                {name}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 34,
                  fontStyle: 'normal',
                  color: '#A3ABB6',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Regular"',
                  marginTop: '6px',
                }}
              >
                @{username}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  color: '#A3ABB6',
                  fontFamily: 'Regular',
                  fontSize: '28px',
                }}
              >
                ${totalEarned} Earned
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Regular', data: interRegular, style: 'normal' },
          { name: 'Medium', data: interMedium, style: 'normal' },
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
