import { HighQualityImage } from '../HighQualityImage';

export function StepOne() {
  return (
    <div className="flex h-[18.75rem] w-[21.5rem] flex-col items-start gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-[0px_4px_6px_0px_rgba(226,232,240,0.41)]">
      <div className="flex w-full gap-4">
        <HighQualityImage
          alt="Pied Piper Logo"
          className="h-12 w-12"
          src="/landingsponsor/sponsors/piedPiper.webp"
        />
        <div className="flex w-full flex-grow flex-col items-start">
          <p className="text-sm font-medium text-slate-400">Company name</p>
          <p className="w-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700">
            Pied Piper
          </p>
        </div>
      </div>

      <div className="flex w-full flex-grow flex-col items-start">
        <p className="text-sm font-medium text-slate-400">Website URL</p>
        <p className="w-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700">
          https://piedpier.com
        </p>
      </div>

      <div className="flex w-full flex-grow flex-col items-start">
        <p className="text-sm font-medium text-slate-400">Twitter Handle</p>
        <p className="w-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700">
          @piedpiper
        </p>
      </div>

      <p className="self-end rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-brand-purple">
        Create Profile
      </p>
    </div>
  );
}
