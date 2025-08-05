import BsFillLaptopFill from '@/components/icons/BsFillLaptopFill';
import TbBriefcase2Filled from '@/components/icons/TbBriefcase2Filled';

import { cn } from '../../../utils/cn';

const BountyIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 8 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.57848 9.37923C3.57848 9.91177 4.26916 10.1209 4.56456 9.67779L7.80495 4.81721C8.04341 4.45952 7.787 3.98041 7.35711 3.98041H4.77457V0.973754C4.77457 0.441218 4.08389 0.232096 3.78849 0.675193L0.548099 5.53578C0.30964 5.89347 0.566053 6.37258 0.99594 6.37258H3.57848V9.37923Z"
      />
    </svg>
  );
};

const GrantIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 12 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.748 1.533L1.8 4.137V5.18h9.896V4.137M9.092 6.221v3.646h1.562V6.22M1.8 12.47h9.896v-1.563H1.8m4.167-4.687v3.646h1.562V6.22m-4.687 0v3.646h1.562V6.22H2.842z" />
    </svg>
  );
};

export const getListingIcon = (type: string, className?: string) => {
  const iconClassName = cn('size-3 fill-gray-500', className);
  switch (type) {
    case 'bounty':
      return <BountyIcon className={iconClassName} />;
    case 'project':
      return <TbBriefcase2Filled className={iconClassName} />;
    case 'hackathon':
      return <BsFillLaptopFill className={iconClassName} />;
    case 'grant':
      return <GrantIcon className={iconClassName} />;
    default:
      return <BountyIcon className={iconClassName} />;
  }
};
