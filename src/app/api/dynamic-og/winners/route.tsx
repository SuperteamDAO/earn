import { ImageResponse } from 'next/og';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { PROJECT_NAME } from '@/constants/project';
import type { SubmissionWithUser } from '@/interface/submission';
import { formatString, loadGoogleFont } from '@/utils/ogHelpers';
import { nthLabelGenerator } from '@/utils/rank';
import { getURL } from '@/utils/validUrl';

import { type Rewards } from '@/features/listings/types';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  maximumFractionDigits: 2,
});

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
          `${winner?.user?.name || ''} ${nthLabelGenerator(winner?.winnerPosition || 0)}`,
      )
      .join(
        '',
      )}Winners Winner ${token || 'USD'} ${Object.values(rewards).join('')}`;

    const interSemiBold = await loadGoogleFont('Inter:wght@600', allText);

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
                    alt={`${winner?.user?.name}`}
                    src={winner?.user?.photo}
                  />
                ) : (
                  <ExternalImage
                    style={{
                      width: '126.26px',
                      height: '126.26px',
                      objectFit: 'cover',
                      borderRadius: '999999px',
                      display: 'flex',
                    }}
                    alt={`${winner?.user?.name}`}
                    src={'/fallback/avatar.png'}
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
                  {formatString(winner?.user?.name ?? '', 30)}
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
                  {token === 'Any' ? 'USD' : (token ?? 'USD')}{' '}
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
                alt={`${PROJECT_NAME} Logo`}
                src={`${getURL()}/assets/logo.svg`}
              />
            </div>
          </div>
        </div>
      ),
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
