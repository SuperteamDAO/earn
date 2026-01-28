'use client';

import PerkCard from '../cards/PerkCard';

interface Perk {
  fields: {
    Name: string;
    Notes?: string;
    Link?: string;
    Logo?: Array<{ url: string }>;
  };
}

interface PerksGridProps {
  perks: Perk[];
}

export default function PerksGrid({ perks }: PerksGridProps) {
  // Calculate offset array for staggered layout
  const offsetArray = new Array(perks?.length ?? 0).fill(false);
  if (offsetArray.length > 1) {
    offsetArray[1] = true;
  }
  for (let i = 2; i < (perks?.length ?? 0); i++) {
    if ((i - 1) % 3 === 0) {
      offsetArray[i] = true;
    } else {
      offsetArray[i] = false;
    }
  }

  const getOffsetClasses = (index: number) => {
    if (offsetArray[index] && index % 2 === 0) {
      return 'mt-0 md:mt-8';
    }
    if (offsetArray[index] && index % 2 === 1) {
      return 'mt-0 lg:mt-8';
    }
    if (!offsetArray[index] && index % 2 === 0) {
      return 'mt-0 md:mt-8 lg:mt-0';
    }
    return 'mt-0';
  };

  return (
    <div className="z-20 mt-[42px] flex items-center justify-center">
      <div className="grid-cards-container flex flex-col gap-8 md:grid md:gap-0">
        {perks.map((perk, index) => (
          <PerkCard
            key={index}
            name={perk.fields['Name']}
            description={perk.fields['Notes'] || ''}
            projectLink={perk.fields['Link'] || '#'}
            imgUrl={perk.fields['Logo']?.[0]?.url || ''}
            className={`col-span-1 row-span-1 ${getOffsetClasses(index)}`}
          />
        ))}
      </div>
    </div>
  );
}
