import { ExternalImage } from '@/components/ui/cloudinary-image';

export const AutoGenerateFeature = () => {
  return (
    <div>
      <div className="relative h-[16.875rem] w-full overflow-hidden">
        <ExternalImage
          className="scale-[1.1] overflow-hidden"
          alt="AI Listing Generation Feature"
          src="ai-review-feature-new"
        />
        <button
          tabIndex={-1}
          className="ph-no-capture pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 scale-125 cursor-default focus:ring-0 focus:outline-hidden"
          onClick={() => {}}
        >
          <div className="group bg-background relative inline-flex h-10 overflow-hidden rounded-[calc(1.5px+0.375rem-2px)] p-[1.5px] pb-[1.8px] shadow-[0px_2px_2.3px_0px_#0000002B] focus:outline-hidden">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF79C1_0%,#76C5FF_50%,#FF79C1_100%)]" />
            <span className="ph-no-capture bg-background inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-1 text-sm font-medium text-slate-500 backdrop-blur-3xl group-hover:bg-slate-50">
              <img src="/assets/ai-wand.svg" alt="Auto Generate AI" />
              Auto Generate
            </span>
          </div>
        </button>
      </div>
      <div className="p-6 pb-0">
        <p className="text-lg font-semibold">Auto Generate your Listings</p>
        <p className="mt-2 text-base font-normal text-slate-500">
          Quickly generate drafts using AI
        </p>
        <div className="mt-6 flex flex-wrap justify-between gap-4 pr-4 text-sm">
          <Point text={'Generate drafts in <1 min'} />
          <Point text={'Get properly structured descriptions'} />
          <Point text={'Regenerate descriptions if unsatisfied'} />
        </div>
      </div>
    </div>
  );
};

function Point({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-3">
      <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12.5" cy="12.5" r="12.5" fill="#E0E7FF" />{' '}
        <path
          d="M10.9991 17.0113L7.42676 13.4389L8.31985 12.5458L10.9991 15.2251L16.7494 9.47482L17.6425 10.3679L10.9991 17.0113Z"
          fill="#615FFF"
        />
      </svg>
      <p className="text-base font-medium text-slate-500">{text}</p>
    </span>
  );
}
