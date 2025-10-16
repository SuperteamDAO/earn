import { ConfettiPoppers } from '../../icons/ConfettiPoppers';
import { HighQualityImage } from '../HighQualityImage';

const winners = [
  {
    name: 'Jake',
    avatar: '/landingsponsor/users/jake.webp',
    place: '1st',
    amount: '1,000 USDC',
  },
  {
    name: 'Keith',
    avatar: '/landingsponsor/users/keith.webp',
    place: '2nd',
    amount: '750 UDC',
  },
  {
    name: 'Mike',
    avatar: '/landingsponsor/users/mike.webp',
    place: '3rd',
    amount: '500 UDC',
  },
];

function PlaceBadge({ label }: { label: string }) {
  return (
    <span className="absolute -bottom-2 left-1/2 flex !size-6 -translate-x-1/2 items-center justify-center rounded-full bg-white text-[0.625rem] font-medium text-slate-500 shadow">
      {label}
    </span>
  );
}

export function StepThree() {
  const first = winners[0]!;
  const second = winners[1]!;
  const third = winners[2]!;

  return (
    <div className="relative flex h-[14.75rem] w-[21.5rem] items-center justify-center overflow-visible rounded-md border border-slate-200 bg-white p-4 shadow-[0px_4px_6px_0px_rgba(226,232,240,0.41)]">
      <ConfettiPoppers className="pointer-events-none absolute inset-0 -z-0 select-none" />

      <div className="relative -top-6 flex h-full w-full flex-col items-center justify-center overflow-visible">
        <div className="relative flex flex-col items-center overflow-visible">
          <div className="relative">
            <HighQualityImage
              alt={first.name}
              className="h-16 w-16 rounded-full object-cover"
              src={first.avatar}
            />
            <PlaceBadge label={first.place} />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            {first.name}
          </p>
          <p className="-mt-1 text-sm font-semibold text-slate-500">
            {first.amount}
          </p>
        </div>

        <div className="mt-0 grid w-full grid-cols-2 gap-6 px-2">
          <div className="flex flex-col items-center">
            <div className="relative">
              <HighQualityImage
                alt={second.name}
                className="h-16 w-16 rounded-full object-cover"
                src={second.avatar}
              />
              <PlaceBadge label={second.place} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {second.name}
            </p>
            <p className="-mt-1 text-sm font-semibold text-slate-500">
              {second.amount}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative">
              <HighQualityImage
                alt={third.name}
                className="h-16 w-16 rounded-full object-cover"
                src={third.avatar}
              />
              <PlaceBadge label={third.place} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {third.name}
            </p>
            <p className="-mt-1 text-sm font-semibold text-slate-500">
              {third.amount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
