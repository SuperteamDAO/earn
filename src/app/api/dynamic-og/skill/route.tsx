import { ImageResponse } from 'next/og';

import { skillMap } from '@/constants/skillMap';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatString, loadGoogleFont } from '@/utils/ogHelpers';

import { OgExploreFooter } from '../OgExploreFooter';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const getParam = (name: string, processFn = (x: string | null) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const skill = getParam('skill', (x) => formatString(x || '', 30));
    const type = getParam('type');

    const allText = `${skill || ''}Remote web3 gigs for talent Explore Opportunities`;

    const [interMedium, interBold] = await Promise.all([
      loadGoogleFont('Inter:wght@500', allText),
      loadGoogleFont('Inter:wght@700', allText),
    ]);

    // Get skill color from skillMap if it's a parent skill
    const skillColor =
      type === 'parent'
        ? skillMap.find((s) => s.mainskill === skill)?.color || '#6366F1'
        : '#6366F1';

    // Calculate dynamic font size based on skill name length
    // Longer names get smaller font sizes to fit better
    const skillLength = skill?.length || 0;
    let skillFontSize = 36;
    if (skillLength > 20) {
      skillFontSize = 24;
    } else if (skillLength > 15) {
      skillFontSize = 28;
    } else if (skillLength > 12) {
      skillFontSize = 32;
    }

    // Use pastel backgrounds like other OG images
    const bgColors = ['#FFFBEB', '#FAFAF9', '#ECFDF5', '#EFF6FF', '#EEF2FF'];
    const randomIndex = Math.floor(Math.random() * bgColors.length);
    const bgColor = bgColors[randomIndex];

    return new ImageResponse(
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
              width: '220px',
              minHeight: '180px',
              borderRadius: '24px',
              backgroundColor: skillColor,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {skill?.split(' ').map((word, i) => (
              <span
                // react-doctor-disable-next-line react-doctor/no-array-index-as-key -- rendered once by ImageResponse into a static image, so there is no reconciliation and repeated words would collide as keys
                key={i}
                style={{
                  fontSize: skillFontSize,
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
                Remote web3 gigs for&nbsp;
              </span>
              <span style={{ color: skillColor, display: 'flex' }}>
                {skill}
              </span>
              <span style={{ display: 'flex' }}>&nbsp;talent</span>
            </div>
          </div>
          <OgExploreFooter />
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Medium', data: interMedium, style: 'normal' },
          { name: 'Bold', data: interBold, style: 'normal' },
        ],
      },
    );
  } catch (e) {
    console.log(getErrorMessage(e));
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
