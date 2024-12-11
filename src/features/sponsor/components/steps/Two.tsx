import { ExternalImage } from '@/components/ui/cloudinary-image';

import { HighQualityImage } from '../HighQualityImage';

export function StepTwo() {
  return (
    <div className="flex h-[18.75rem] w-[21.5rem] flex-col rounded-md border border-slate-200 bg-white shadow-[0px_4px_6px_0px_rgba(226,232,240,0.41)]">
      <div className="flex flex-col items-start gap-4 p-4 pb-3">
        <div className="flex w-full gap-4">
          <HighQualityImage
            alt="Pied Piper Logo"
            className="h-12 w-12"
            src="/landingsponsor/sponsors/piedPiper.webp"
          />
          <div className="flex w-full flex-col items-start gap-0 text-sm">
            <p className="font-semibold text-slate-700">
              Write a Deep Dive on PiperCoin
            </p>
            <div className="flex gap-2">
              <p className="bg-slate-50 font-semibold text-slate-400">
                By Pied Piper
              </p>
              <div className="h-6 w-px bg-slate-200" />
              <p className="bg-slate-50 font-medium text-slate-400">
                Ends in 21 days
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm font-medium text-slate-500">
          Pied Piper is a pioneering middle-out compression company. The company
          is looking for bounty hunters to deep dive into the $PIPER coin, and
          explain the coin’s background and utility to noobs.
        </p>
        <div className="flex w-full justify-between text-xs">
          <p className="font-medium text-slate-400">Skills</p>
          <div className="flex gap-2">
            <p className="rounded-md bg-[#0D3D990A] px-2 py-1 font-medium text-[#0d3d99]">
              Writing
            </p>
            <p className="rounded-md bg-[#F56f230A] px-2 py-1 font-medium text-[#F56f23]">
              Marketing
            </p>
            <p className="rounded-md bg-[#8382810A] px-2 py-1 font-medium text-[#838281]">
              Community
            </p>
          </div>
        </div>
      </div>
      <div className="h-px bg-slate-200" />
      <div className="flex w-full justify-between px-4">
        <div className="flex gap-2">
          <ExternalImage src="/landingsponsor/icons/usdc.svg" alt="usdc icon" />
          <p className="font-semibold text-slate-800">$1,000</p>
        </div>
        <p className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-brand-purple">
          Post Bounty
        </p>
      </div>
    </div>
  );
}
