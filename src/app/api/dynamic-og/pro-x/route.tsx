import { ImageResponse } from 'next/og';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { convertToJpegUrl } from '@/utils/cloudinary';
import { formatString, loadGoogleFont } from '@/utils/ogHelpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const getParam = (name: any, processFn = (x: any) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const name = getParam('name', (x) => formatString(x, 24));
    const username = getParam('username', (x) => formatString(x, 28));
    const photo = getParam('photo', (x) => convertToJpegUrl(x));

    const allText = `${name || ''}${username || ''}`;

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
            backgroundImage: `url(${ASSET_URL}/pro/x.png)`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100%',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginTop: '423px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {photo ? (
              <img
                style={{
                  width: '104px',
                  height: '104px',
                  borderRadius: '104px',
                  objectFit: 'cover',
                }}
                alt="pfp"
                src={photo}
              />
            ) : (
              <div
                style={{
                  width: '104px',
                  height: '104px',
                  borderRadius: '104px',
                  backgroundColor: '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
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
                  fontSize: 42,
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
                  fontSize: 26,
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
