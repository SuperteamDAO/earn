import { ASSET_URL } from '@/constants/ASSET_URL';

export function Banner() {
  return (
    <div className="flex h-[8rem] items-center overflow-hidden rounded-md bg-[#020617]">
      <div className="flex md:w-[100]">
        <img alt="Ranks 3d" src={ASSET_URL + '/leaderboard/ranks3d.webp'} />
      </div>
      <div className="flex flex-col items-start gap-1 text-sm sm:text-base">
        <p className="text-lg font-semibold text-white">Talent Leaderboard</p>
        <p className="line mt-1 leading-5 text-slate-400">
          See where you stand amongst the {"Solana's"} top contributors
        </p>
      </div>
      <div className="flex h-full md:hidden">
        <img
          className="w-full"
          alt="Illustration"
          src={ASSET_URL + '/leaderboard/banner-mobile.webp'}
        />
      </div>
      <div className="ml-auto hidden h-full w-[40%] md:flex">
        <img
          className="ml-8 h-full w-full"
          alt="Illustration"
          src={ASSET_URL + '/leaderboard/banner-desktop.webp'}
        />
      </div>
    </div>
  );
}
