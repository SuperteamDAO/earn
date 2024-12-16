import { ExternalImage } from '@/components/ui/cloudinary-image';

export function Banner() {
  return (
    <div className="flex h-[8rem] items-center overflow-hidden rounded-md bg-slate-950">
      <div className="flex md:w-[100]">
        <ExternalImage alt="Ranks 3d" src={'/leaderboard/ranks3d.webp'} />
      </div>
      <div className="flex flex-col items-start gap-1 text-sm sm:text-base">
        <p className="text-lg font-semibold text-white">Talent Leaderboard</p>
        <p className="line mt-1 leading-5 text-slate-400">
          See where you stand amongst the {"Solana's"} top contributors
        </p>
      </div>
      <div className="flex h-full md:hidden">
        <ExternalImage
          className="w-full"
          alt="Illustration"
          src={'/leaderboard/banner-mobile.webp'}
        />
      </div>
      <div className="ml-auto hidden h-full w-[40%] md:flex">
        <ExternalImage
          className="ml-8 h-full w-full"
          alt="Illustration"
          src={'/leaderboard/banner-desktop.webp'}
        />
      </div>
    </div>
  );
}
