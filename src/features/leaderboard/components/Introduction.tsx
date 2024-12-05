import { ASSET_URL } from '@/constants/ASSET_URL';

export function Introduction() {
  return (
    <div className="items-star font-sm flex w-full flex-col gap-4 rounded-xl bg-[#FAF5FF] p-6">
      <div className="flex flex-col items-start">
        <img
          className="h-26 w-26"
          alt="Medal"
          src={ASSET_URL + '/leaderboard/medal.webp'}
        />
        <p className="font-semibold">Introducing Leaderboards</p>
        <p className="text-slate-600">
          Get Inspired: Check out Earn profiles of the leading contributors of
          the Solana ecosystem!
        </p>
      </div>
      <div className="h-px w-full bg-slate-400" />
      <div className="flex flex-col items-start">
        <div className="flex gap-2">
          <img
            className="w-5"
            src={ASSET_URL + '/leaderboard/progress'}
            alt="progress icon"
          />
          <p className="text-slate-600">Track your progress as you earn</p>
        </div>
        <div className="flex gap-2">
          <img
            className="w-5"
            src={ASSET_URL + '/leaderboard/rank'}
            alt="progress icon"
            style={{ paddingRight: '0.4rem' }}
          />
          <p className="text-slate-600">
            Discover top profiles {'&'} their submissions
          </p>
        </div>
        <div className="flex gap-2">
          <img
            className="w-5"
            src={ASSET_URL + '/leaderboard/semistart'}
            alt="progress icon"
            style={{ paddingRight: '0.6rem' }}
          />
          <p className="text-slate-600">
            Improve your skills {'&'} rise through the ranks
          </p>
        </div>
      </div>
    </div>
  );
}
