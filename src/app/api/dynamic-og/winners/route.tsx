import { ImageResponse } from 'next/og';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import type { SubmissionWithUser } from '@/interface/submission';
import { convertToJpegUrl } from '@/utils/cloudinary';
import { formatString, loadGoogleFont } from '@/utils/ogHelpers';
import { nthLabelGenerator } from '@/utils/rank';

import { type Rewards } from '@/features/listings/types';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  maximumFractionDigits: 2,
});

const BORING_AVATAR_COLORS = [
  '#da4c65',
  '#5e25c2',
  '#d433ab',
  '#2e53af',
  '#ceea94',
  '#92a1c6',
  '#f0ab3d',
  '#c271b4',
];

const AVATAR_SIZE = 80;

const getAvatarSeed = (winner: SubmissionWithUser) => {
  return (
    winner?.user?.id ||
    [winner?.user?.firstName, winner?.user?.lastName, winner?.id]
      .filter(Boolean)
      .join('-') ||
    `winner-${winner?.id}`
  );
};

const hashCode = (value: string) => {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }

  return Math.abs(hash);
};

const getDigit = (number: number, index: number) =>
  Math.floor((number / 10 ** index) % 10);

const getBoolean = (number: number, index: number) =>
  !(getDigit(number, index) % 2);

const getUnit = (number: number, range: number, index?: number) => {
  const value = number % range;
  return index && getDigit(number, index) % 2 === 0 ? -value : value;
};

const getRandomColor = (number: number) =>
  BORING_AVATAR_COLORS[number % BORING_AVATAR_COLORS.length];

const getMarbleData = (seed: string) => {
  const hash = hashCode(seed);

  return Array.from({ length: 4 }, (_, index) => ({
    color: getRandomColor(hash + index),
    translateX: getUnit(hash * (index + 1), AVATAR_SIZE / 2 - (index + 17), 1),
    translateY: getUnit(hash * (index + 1), AVATAR_SIZE / 2 - (index + 17), 2),
    rotate: getUnit(hash * (index + 1), 360),
    isSquare: getBoolean(hash, 2),
  }));
};

const createBoringAvatarSvgDataUri = (seed: string) => {
  const [bg, layerRect, layerCircle, layerLine] = getMarbleData(seed);

  const svg = `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" fill="${bg?.color}" />
      <rect
        x="10"
        y="30"
        width="80"
        height="${layerRect?.isSquare ? 80 : 10}"
        fill="${layerRect?.color}"
        transform="translate(${layerRect?.translateX} ${layerRect?.translateY}) rotate(${layerRect?.rotate} 40 40)"
      />
      <circle
        cx="40"
        cy="40"
        r="16"
        fill="${layerCircle?.color}"
        transform="translate(${layerCircle?.translateX} ${layerCircle?.translateY})"
      />
      <line
        x1="0"
        y1="40"
        x2="80"
        y2="40"
        stroke-width="2"
        stroke="${layerLine?.color}"
        transform="translate(${layerLine?.translateX} ${layerLine?.translateY}) rotate(${layerLine?.rotate} 40 40)"
      />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url.replaceAll('&amp%3B', '&'));

    const getParam = (name: string, processFn = (x: any) => x) =>
      searchParams.has(name) ? processFn(searchParams.get(name)) : null;

    const id = getParam('id', (x) => decodeURIComponent(x)) as string;

    const token = getParam('token', (x) => decodeURIComponent(x)) as
      | string
      | undefined;

    const rewards = getParam('rewards', (x) =>
      JSON.parse(decodeURIComponent(x)),
    ) as Rewards;

    const submissions = getParam('submissions', (x) =>
      JSON.parse(decodeURIComponent(x)),
    ) as SubmissionWithUser[];

    if (!id) throw new Error('ID IS MISSING');
    if (!rewards) throw new Error('REWARDS IS MISSING');
    if (!submissions) throw new Error('SUBMISSIONS IS MISSING');

    const allText = `${submissions
      .map(
        (winner) =>
          `${winner?.user?.firstName || ''} ${winner?.user?.lastName || ''} ${nthLabelGenerator(winner?.winnerPosition || 0)}`,
      )
      .join(
        '',
      )}Winners Winner ${token || 'USD'} ${Object.values(rewards).join('')}`;

    const interSemiBold = await loadGoogleFont('Inter:wght@600', allText);

    return new ImageResponse(
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          overflow: 'hidden',
          width: '1200px',
          height: '675px',
          color: 'white',
          background: 'linear-gradient(180deg, #7F57F7 0%, #9B44FE 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            top: '1.5rem',
            color: 'rgba(255, 245, 245, 0.07)',
            fontSize: '250px',
            fontWeight: '500',
          }}
        >
          {submissions.length > 1 ? 'Winners' : 'Winner'}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            gap: '3.5rem',
            margin: 'auto',
          }}
        >
          {submissions.slice(0, 5).map((winner) => (
            <div
              key={winner.id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {winner?.user?.photo ? (
                <img
                  style={{
                    width: '126.26px',
                    height: '126.26px',
                    objectFit: 'cover',
                    borderRadius: '999999px',
                    display: 'flex',
                  }}
                  alt={`${winner?.user?.firstName} ${winner?.user?.lastName}`}
                  src={
                    convertToJpegUrl(winner?.user?.photo) || winner?.user?.photo
                  }
                />
              ) : (
                <img
                  style={{
                    width: '126.26px',
                    height: '126.26px',
                    objectFit: 'cover',
                    borderRadius: '999999px',
                    display: 'flex',
                  }}
                  alt={`${winner?.user?.firstName} ${winner?.user?.lastName}`}
                  src={createBoringAvatarSvgDataUri(getAvatarSeed(winner))}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  top: '-1.75rem',
                  minWidth: '50px',
                  maxWidth: '50px',
                  minHeight: '50px',
                  maxHeight: '50px',
                  padding: '10px',
                  color: 'white',
                  fontSize: '18.11px',
                  fontWeight: '600',
                  backgroundColor: 'rgba(157, 111, 255, 1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {nthLabelGenerator(winner?.winnerPosition || 0)}
                </span>
              </div>
              <div
                style={{
                  maxWidth: '220px',
                  marginTop: '0.5rem',
                  fontSize: '27.17px',
                  fontWeight: '600',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatString(winner?.user?.firstName ?? '', 30)}
              </div>
              <div
                style={{
                  maxWidth: '220px',
                  marginTop: '-0.2rem',
                  fontSize: '27.17px',
                  fontWeight: '600',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatString(winner?.user?.lastName ?? '', 30)}
              </div>
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  color: 'rgba(255, 255, 255, 0.58)',
                  fontSize: '24.17px',
                  fontWeight: '500',
                  textAlign: 'center',
                }}
              >
                {token ?? 'USD'}{' '}
                {rewards &&
                  formatter.format(
                    +(rewards[winner?.winnerPosition as keyof Rewards] ?? 0),
                  )}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingLeft: '2.5rem',
            paddingRight: '2.5rem',
            paddingTop: '3.5rem',
            paddingBottom: '3.5rem',
          }}
        >
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
            }}
          >
            <ExternalImage
              style={{
                width: '200px',
                display: 'flex',
              }}
              alt="ST Earn Logo"
              src={'/logo/st-earn-white.svg'}
            />
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 645,
        fonts: [{ name: 'Inter', data: interSemiBold, style: 'normal' }],
      },
    );
  } catch (err: any) {
    console.log(`${err.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
