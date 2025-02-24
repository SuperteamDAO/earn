import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { IoMdShareAlt } from 'react-icons/io';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useClipboard } from '@/hooks/use-clipboard';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Facebook } from '@/svg/socials/facebook';
import { Linkedin } from '@/svg/socials/linkedin';
import { Telegram } from '@/svg/socials/telegram';
import { Whatsapp } from '@/svg/socials/whatsapp';
import { X } from '@/svg/socials/x';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { type Listing } from '../../types';

export function ShareListing({
  listing,
  className,
}: {
  className?: string;
  listing: Listing | undefined;
}) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className={cn('font-medium text-slate-500', className)}
          >
            <IoMdShareAlt className="text-slate-500" />
            SHARE
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-medium">
              Share this opportunity
            </DialogTitle>
            <DialogDescription className="sr-only">
              {`Share this opportunity`}
            </DialogDescription>
          </DialogHeader>
          <MainContent listing={listing} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          className={cn('font-medium text-slate-500', className)}
        >
          <IoMdShareAlt className="text-slate-500" />
          SHARE
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="mb-2 text-left">
          <DrawerTitle className="font-medium">
            Share this opportunity
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {`Share this opportunity`}
          </DrawerDescription>
        </DrawerHeader>
        <MainContent listing={listing} className="px-4" />
        <DrawerFooter className="pt-2"></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function MainContent({
  className,
  listing,
}: {
  className?: string;
  listing: Listing | undefined;
}) {
  const listingLink = React.useCallback(
    () => `${getURL()}listing/${listing?.slug}/`,
    [listing?.slug],
  );

  const shareMessage = (source?: 'telegram' | 'facebook' | 'linkedin') => {
    if (
      source === 'telegram' ||
      source === 'facebook' ||
      source === 'linkedin'
    ) {
      return encodeURIComponent(
        `\nCheck this out! I just came across this ${listing?.type} by ${listing?.sponsor?.name} on Superteam Earn!`,
      );
    }
    return encodeURIComponent(
      `I just came across this ${listing?.type} by ${listing?.sponsor?.name} on Superteam Earn! Check it out: \n${listingLink()}`,
    );
  };

  const { hasCopied, onCopy } = useClipboard(listingLink());

  const shareLinks = React.useMemo(
    () => [
      {
        name: 'X (Twitter)',
        icon: X,
        url: `https://twitter.com/intent/tweet?text=${shareMessage()}`,
      },
      {
        name: 'Telegram',
        icon: Telegram,
        url: `https://t.me/share/url?url=${encodeURIComponent(listingLink())}&text=${shareMessage('telegram')}`,
      },
      {
        name: 'Whatsapp',
        icon: Whatsapp,
        url: `https://api.whatsapp.com/send?text=${shareMessage()}`,
      },
      // {
      //   name: 'Discord',
      //   // Discord doesn't have a direct share URL
      //   icon: Discord,
      //   url: `https://discord.com/channels/@me?message=${shareMessage()}`,
      // },
      {
        name: 'LinkedIn',
        icon: Linkedin,
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(listingLink())}&summary=${shareMessage('linkedin')}`,
      },
      {
        name: 'Facebook',
        icon: Facebook,
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingLink())}&t=${shareMessage('facebook')}`,
      },
    ],
    [shareMessage, listingLink],
  );

  const handleShare = React.useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className={cn('space-y-4 overflow-hidden', className)}>
      <Button
        variant="secondary"
        className="group w-full justify-between"
        onClick={onCopy}
      >
        <span className="truncate font-normal text-slate-500">
          earn.superteam.fun/listing/{listing?.slug}
        </span>
        {hasCopied ? (
          <Check className="h-5 w-5 text-slate-400" />
        ) : (
          <Copy className="h-5 w-5 text-slate-400" />
        )}
      </Button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {shareLinks.map((platform) => (
          <Button
            key={platform.name}
            variant="ghost"
            size="icon"
            className="h-fit w-fit rounded-full !p-0"
            onClick={() => handleShare(platform.url)}
          >
            <platform.icon
              styles={{
                height: '3rem',
                width: '3rem',
              }}
            />
            <span className="sr-only">Share on {platform.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
