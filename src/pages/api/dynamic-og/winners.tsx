import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

import { type Rewards } from '@/features/listings';
import type { SubmissionWithUser } from '@/interface/submission';
import { fetchAsset, formatString } from '@/utils/ogHelpers';
import { nthLabelGenerator } from '@/utils/rank';

export const config = {
  runtime: 'edge',
};

const fontDataP = fetchAsset(
  new URL('../../../../public/Inter-SemiBold.woff', import.meta.url),
);

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  maximumFractionDigits: 2,
});

export default async function handler(request: NextRequest) {
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

    const logo = getParam('logo', (x) => decodeURIComponent(x)) as string;

    const fallback = getParam('fallback', (x) =>
      decodeURIComponent(x),
    ) as string;

    if (!id) throw new Error('ID IS MISSING');
    if (!rewards) throw new Error('REWARDS IS MISSING');
    if (!submissions) throw new Error('SUBMISSIONS IS MISSING');

    const [fontData] = await Promise.all([fontDataP]);

    return new ImageResponse(
      (
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
                    src={winner?.user?.photo}
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
                    src={fallback}
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
                    borderRadius: '50%', // This makes the div a circle
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
              <img
                style={{
                  width: '200px',
                  display: 'flex',
                }}
                alt="ST Earn Logo"
                src={logo}
              />
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 645,
        fonts: [{ name: 'var(--font-sans)', data: fontData, style: 'normal' }],
      },
    );
  } catch (err: any) {
    console.log(`${err.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
