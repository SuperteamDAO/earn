import { ASSET_URL } from '@/constants/ASSET_URL';

// Rendered by ImageResponse (satori), so inline styles only and no hooks.
export function OgExploreFooter() {
  return (
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
  );
}
