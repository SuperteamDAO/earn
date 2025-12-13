import { ImageResponse } from 'next/og';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { formatString, loadGoogleFont } from '@/utils/ogHelpers';

import {
  type CategoryType,
  getCategoryInfo,
} from '@/features/listings/utils/category';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const getParam = (name: string, processFn = (x: string | null) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const category = getParam('category', (x) => formatString(x || '', 30));

    const allText = `${category || ''}Remote web3 gigs in Explore Opportunities`;

    const [interMedium, interBold] = await Promise.all([
      loadGoogleFont('Inter:wght@500', allText),
      loadGoogleFont('Inter:wght@700', allText),
    ]);

    // Get category color from category info
    let categoryColor = '#6366F1'; // Default color
    if (category) {
      try {
        const categoryInfo = getCategoryInfo(category as CategoryType);
        categoryColor = categoryInfo.color;
      } catch {
        // Use default color if category not found
      }
    }

    // Calculate dynamic font size and box dimensions based on category name length
    const categoryLength = category?.length || 0;
    let categoryFontSize = 40;
    let boxWidth = 220;
    let boxMinHeight = 180;

    if (categoryLength > 12) {
      categoryFontSize = 28;
      boxWidth = 260;
      boxMinHeight = 200;
    } else if (categoryLength > 10) {
      categoryFontSize = 32;
      boxWidth = 240;
      boxMinHeight = 190;
    }

    // Use pastel backgrounds like other OG images
    const bgColors = ['#FFFBEB', '#FAFAF9', '#ECFDF5', '#EFF6FF', '#EEF2FF'];
    const randomIndex = Math.floor(Math.random() * bgColors.length);
    const bgColor = bgColors[randomIndex];

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
            <div
              style={{
                width: `${boxWidth}px`,
                minHeight: `${boxMinHeight}px`,
                borderRadius: '24px',
                backgroundColor: categoryColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
              }}
            >
              {category?.split(' ').map((word, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: categoryFontSize,
                    fontFamily: '"Bold"',
                    color: 'white',
                    lineHeight: 1.3,
                    display: 'flex',
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#ffffff',
              height: '100%',
              width: '70%',
              display: 'flex',
              flexDirection: 'column',
              padding: '80px 80px',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 54,
                  fontStyle: 'normal',
                  color: 'black',
                  lineHeight: 1.2,
                  letterSpacing: '-1px',
                  fontFamily: '"Bold"',
                  display: 'flex',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex' }}>
                  Remote web3 gigs in&nbsp;
                </span>
                <span style={{ color: categoryColor, display: 'flex' }}>
                  {category}
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
                position: 'absolute',
                bottom: '80px',
                left: '80px',
                right: '80px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontStyle: 'normal',
                    color: '#64748B',
                    lineHeight: 1.4,
                    fontFamily: '"Medium"',
                    display: 'flex',
                  }}
                >
                  Explore Opportunities
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
              <img
                style={{
                  width: '108px',
                  height: '28px',
                  objectFit: 'contain',
                }}
                alt="earn"
                src={ASSET_URL + '/logo/logo-grayed.png'}
              />
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Medium', data: interMedium, style: 'normal' },
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
