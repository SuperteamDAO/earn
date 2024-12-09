import { HighQualityImage } from './HighQualityImage';
import { Stars } from './Stars';

export interface TestimonialProps {
  stars: number;
  message: string;
  pfp: string;
  name: string;
  position: string;
  logo: string;
}
export function TestimonialCard({
  stars,
  message,
  pfp,
  name,
  position,
  logo,
}: TestimonialProps) {
  return (
    <div className="flex w-full flex-1 flex-col gap-2 rounded border border-slate-300">
      <div className="flex h-[14.754rem] w-full items-center justify-center rounded bg-black">
        <HighQualityImage src={logo} alt={position} />
      </div>

      <div className="mt-auto flex h-full flex-1 flex-col items-start gap-4 p-4">
        <Stars count={5} filled={stars} />
        <div
          className="text-[1.3rem] leading-[1.1] text-slate-600"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <div className="mt-auto flex items-center gap-2 pt-4">
          <div className="h-[2.1rem] w-[2.1rem] gap-6">
            <HighQualityImage src={pfp} alt={name} className="h-full w-full" />
          </div>
          <div className="flex flex-col items-start gap-0">
            <p className="text-base text-black">{name}</p>
            <p className="text-base text-slate-500">{position}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
