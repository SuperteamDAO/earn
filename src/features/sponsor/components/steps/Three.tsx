import { HighQualityImage } from '../HighQualityImage';

const submissions = [
  {
    avatar: '/landingsponsor/users/jake.webp',
    title: 'Jake’s Submission',
    subtitle: 'jake.substack.com/why-piper-coin...',
  },
  {
    avatar: '/landingsponsor/users/keith.webp',
    title: 'Keith’s Submission',
    subtitle: 'keith.substack.com/why-piper-coin...',
  },
  {
    avatar: '/landingsponsor/users/mike.webp',
    title: 'Mike’s Submission',
    subtitle: 'mike.substack.com/why-piper-coin...',
  },
];

interface ProfileProps {
  submissions: (typeof submissions)[0];
}

function Profile({ submissions }: ProfileProps) {
  return (
    <div className="flex w-full gap-4 rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0px_4px_6px_0px_rgba(226,232,240,0.41)]">
      <HighQualityImage
        src={submissions.avatar}
        alt={submissions.title}
        className="h-12 w-12"
      />
      <div className="flex flex-col items-start gap-0">
        <p className="text-sm font-medium">{submissions.title}</p>
        <p className="text-sm font-medium text-slate-500">
          {submissions.subtitle}
        </p>
      </div>
    </div>
  );
}

export function StepThree() {
  return (
    <div className="flex h-[18.75rem] w-[21.5rem] flex-col justify-between">
      {submissions.map((submission, index) => (
        <Profile key={index} submissions={submission} />
      ))}
    </div>
  );
}
