import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ExternalImage } from '@/components/ui/cloudinary-image';

export const AutoGenerateFeature = () => {
  return (
    <div>
      <AspectRatio ratio={960 / 638}>
        <ExternalImage
          src="/announcements/auto-generate"
          alt="Auto Generate Announcement Illustration"
          className="mx-auto w-full"
          loading="eager"
          decoding="sync"
          width={960}
          height={638}
        />
      </AspectRatio>
      <div className="p-6 pb-0">
        <p className="text-lg font-semibold">Generate your Listings with AI</p>
        <p className="mt-2 text-base font-normal text-slate-500">
          Creating a listing is now effortless! Provide a few details and let
          our AI generate a complete listing for you, saving you time and
          effort.
        </p>
        <div className="mt-6 flex flex-wrap justify-between gap-4 pr-4 text-sm">
          <Point text={'Generate drafts in less than 1 min'} />
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
