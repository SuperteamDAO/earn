import { ExternalImage } from '@/components/ui/cloudinary-image';
import { CHAIN_NAME, PROJECT_NAME } from '@/constants/project';

export function Introduction() {
  return (
    <div className="items-star flex w-full flex-col gap-4 rounded-xl bg-purple-50 p-6 text-sm">
      <div className="flex flex-col items-start">
        <ExternalImage
          className="h-7 w-7"
          alt="Medal"
          src={'/leaderboard/medal.webp'}
        />
        <p className="my-2 font-semibold">Introducing Leaderboards</p>
        <p className="text-slate-600">
          Get Inspired: Check out {PROJECT_NAME} profiles of the leading
          contributors of the {CHAIN_NAME} ecosystem!
        </p>
      </div>
      <div className="h-px w-full bg-slate-200" />
      <div className="flex flex-col items-start gap-2">
        <div className="flex gap-2">
          <ExternalImage
            className="w-5"
            src={'/leaderboard/progress'}
            alt="progress icon"
          />
          <p className="text-slate-600">Track your progress as you earn</p>
        </div>
        <div className="flex gap-2">
          <ExternalImage
            className="w-5"
            src={'/leaderboard/rank'}
            alt="progress icon"
            style={{ paddingRight: '0.4rem' }}
          />
          <p className="text-slate-600">
            Discover top profiles {'&'} their submissions
          </p>
        </div>
        <div className="flex gap-2">
          <ExternalImage
            className="w-5"
            src={'/leaderboard/semistart'}
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
