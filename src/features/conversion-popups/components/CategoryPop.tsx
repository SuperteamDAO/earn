import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { categoryEarningsQuery } from '@/features/listings';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { type CategoryKeys } from '@/pages/api/listings/category-earnings';
import { formatNumberWithSuffix } from '@/utils';

import { showAnyPopupAtom } from '../atoms';
import { GetStarted } from './GetStarted';

type CategoryVariant = {
  title: string;
  description: string;
};

const getCategoryInfo = (
  category: CategoryKeys,
  totalEarnings: number | undefined,
): CategoryVariant[] => {
  const formatEarnings = totalEarnings
    ? formatNumberWithSuffix(totalEarnings) || ''
    : '';
  console.log('totalEarnings format', formatEarnings);
  console.log('totalEarnings param', totalEarnings);
  console.log(
    'totalEarnings suffix',
    formatNumberWithSuffix(totalEarnings || 0),
  );

  const categoryMap: Record<CategoryKeys, CategoryVariant[]> = {
    design: [
      {
        title: 'Join Designers like you',
        description:
          'Never miss out on high-paying design opportunities from the best companies in crypto.',
      },
      {
        title: `Designers have earned $${formatEarnings} from Earn`,
        description:
          'Sign up on Earn to get access to design opportunities worth thousands of dollars.',
      },
      {
        title: 'Your road to a Web3 Design job',
        description:
          'Build proof of work by attempting bounties to land your dream web3 design job!',
      },
    ],
    content: [
      {
        title: 'Join Creators like you',
        description:
          'Never miss out on high-paying content opportunities from the best companies in crypto.',
      },
      {
        title: `Creators have earned $${formatEarnings} from Earn`,
        description:
          'Sign up on Earn to get access to content opportunities worth thousands of dollars.',
      },
      {
        title: 'Your road to a Web3 Creator job',
        description:
          'Build proof of work by attempting bounties to land your dream web3 content job!',
      },
    ],
    development: [
      {
        title: 'Join Developers like you',
        description:
          'Never miss out on high-paying development opportunities from the best companies in crypto.',
      },
      {
        title: `Developers have earned ${formatEarnings} from Earn`,
        description:
          'Sign up on Earn to get access to development opportunities worth thousands of dollars.',
      },
      {
        title: 'Your road to a Web3 Development job',
        description:
          'Build proof of work by attempting bounties to land your dream web3 development job!',
      },
    ],
  };

  return categoryMap[category];
};

type CategoryVariantInfo = CategoryVariant & { icon: string };

export const CategoryPop = ({ category }: { category: CategoryKeys }) => {
  const [showAnyPopup, setShowAnyPopup] = useAtom(showAnyPopupAtom);

  const [variant, setVariant] = useState<CategoryVariantInfo>();
  const [open, setOpen] = useState(false);
  const { status } = useSession();

  const activateQuery = useMemo(
    () => status === 'unauthenticated' && showAnyPopup,
    [status, showAnyPopup],
  );

  const { data: totalEarnings } = useQuery({
    ...categoryEarningsQuery(category),
    enabled: activateQuery,
  });

  useMemo(() => {
    console.log('totalEarnings', totalEarnings);
  }, [totalEarnings]);

  const isMD = useBreakpoint('md');

  const initated = useRef(false); // only run use effect once
  useEffect(() => {
    if (
      !initated.current &&
      status === 'unauthenticated' &&
      showAnyPopup &&
      totalEarnings?.totalEarnings &&
      !open
    ) {
      initated.current = true;
      setTimeout(() => {
        setTimeout(() => {
          const variant =
            Number(localStorage.getItem('category-pop-variant')) || 0;
          const newVariant = variant >= 2 ? 0 : variant + 1;

          const currentCategoryInfo = getCategoryInfo(
            category,
            totalEarnings?.totalEarnings,
          );
          setVariant({
            title: '',
            description: '',
            icon: `/assets/category_assets/icons/${category}.png`,
            ...currentCategoryInfo[newVariant],
          });

          localStorage.setItem('category-pop-variant', String(newVariant));
          setOpen(true);
          setShowAnyPopup(false);
        }, 5_000);
      }, 0);
    }
  }, [status, totalEarnings?.totalEarnings]);

  if (!isMD) {
    return <Mobile open={open} setOpen={setOpen} variant={variant} />;
  }

  return <Desktop open={open} setOpen={setOpen} variant={variant} />;
};

const Mobile = ({
  open,
  setOpen,
  variant,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  variant: CategoryVariantInfo | undefined;
}) => {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <Image
            src={variant?.icon || ''}
            alt={`${variant?.title}`}
            width={100}
            height={100}
            className="w-12 rounded-md object-contain"
          />
          <DrawerTitle className="pt-2 text-base font-semibold">
            {variant?.title}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-slate-500">
            {variant?.description}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="pt-0">
          <GetStarted />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const Desktop = ({
  open,
  setOpen,
  variant,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  variant: CategoryVariantInfo | undefined;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-white" hideCloseIcon>
        <DialogHeader className="">
          <Image
            src={variant?.icon || ''}
            alt={`${variant?.title}`}
            width={100}
            height={100}
            className="w-12 rounded-md object-contain"
          />
          <DialogTitle className="pt-2 text-base font-semibold">
            {variant?.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {variant?.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="">
          <GetStarted />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
