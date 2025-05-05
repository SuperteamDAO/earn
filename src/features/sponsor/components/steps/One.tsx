import { HighQualityImage } from '../HighQualityImage';

export function StepOne() {
  return (
    <div className="flex h-[18.75rem] w-[21.5rem] flex-col items-start gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-[0px_4px_6px_0px_rgba(226,232,240,0.41)]">
      <div className="flex w-full gap-4">
        <HighQualityImage
          alt="Race of Sloths Logo"
          className="h-12 w-12"
          src="/landingsponsor/sponsors/raceOfSloths.svg"
        />
        <div className="flex w-full flex-grow flex-col items-start">
          <p className="text-sm font-medium text-slate-400">Entity name</p>
          <p className="w-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700">
            Race of Sloths
          </p>
        </div>
      </div>

      <div className="flex w-full flex-grow flex-col items-start">
        <p className="text-sm font-medium text-slate-400">Website URL</p>
        <p className="w-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700">
          https://race-of-sloths.com
        </p>
      </div>

      <div className="flex w-full flex-grow flex-col items-start">
        <p className="text-sm font-medium text-slate-400">Twitter Handle</p>
        <p className="w-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700">
          @race_of_sloths
        </p>
      </div>

      <p className="self-end rounded-lg bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
        Create Profile
      </p>
    </div>
  );
}
