import { atom, useAtom } from 'jotai';
import { useRouter } from 'next/router';

import { cn } from '@/utils';

type GrantSnackbarType = {
  isPublished: boolean;
};

export const grantSnackbarAtom = atom<GrantSnackbarType | null>(null);

export const GrantSnackbar = () => {
  const router = useRouter();
  const [grantSnackbar] = useAtom(grantSnackbarAtom);

  const { asPath } = router;

  const showSnackbar =
    asPath.split('/')[1] === 'grants' && !!asPath.split('/')[2];

  if (!grantSnackbar) return null;

  const { isPublished } = grantSnackbar;

  const getBackgroundColor = () => {
    return isPublished ? 'bg-[#B869D3]' : 'bg-[#DC4830]';
  };

  const getSnackbarMessage = (): string | null => {
    if (!isPublished)
      return 'This Grant Is Inactive Right Now. Check Out Other Grants on Our Homepage!';

    return null;
  };

  const message = getSnackbarMessage();
  const bgColorClass = getBackgroundColor();

  if (showSnackbar && grantSnackbar && message) {
    return (
      <div
        className={cn(
          'flex w-full items-center justify-center gap-1 text-white',
          bgColorClass,
        )}
      >
        <p className="p-3 text-center text-xs font-medium md:text-sm">
          {message}
        </p>
      </div>
    );
  }
  return null;
};
