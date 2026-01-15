import { Check, Copy } from 'lucide-react';
import posthog from 'posthog-js';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useClipboard } from '@/hooks/use-clipboard';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Facebook } from '@/svg/socials/facebook';
import { Linkedin } from '@/svg/socials/linkedin';
import { Telegram } from '@/svg/socials/telegram';
import { Whatsapp } from '@/svg/socials/whatsapp';
import { X } from '@/svg/socials/x';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { type Grant } from '@/features/grants/types';

import { type Listing } from '../../types';

type SourceType =
  | {
      source: 'listing';
      listing: Listing | undefined;
      grant?: undefined;
    }
  | {
      source: 'grant';
      grant: Grant | undefined;
      listing?: undefined;
    };
export function ShareListing({
  source,
  listing,
  grant,
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} & SourceType) {
  function setShareOpen(o: boolean) {
    if (o) posthog.capture('open_share listing');
    else posthog.capture('close_share listing');
    if (onOpenChange) onOpenChange(o);
  }
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-medium">
              Share this opportunity
            </DialogTitle>
            <DialogDescription className="sr-only">
              {`Share this opportunity`}
            </DialogDescription>
          </DialogHeader>
          {source === 'grant' ? (
            <MainContent source={'grant'} grant={grant} />
          ) : (
            <MainContent source={'listing'} listing={listing} />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setShareOpen}>
      <DrawerContent>
        <DrawerHeader className="mb-2 text-left">
          <DrawerTitle className="font-medium">
            Share this opportunity
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {`Share this opportunity`}
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          {source === 'grant' ? (
            <MainContent source={'grant'} grant={grant} />
          ) : (
            <MainContent source={'listing'} listing={listing} />
          )}
        </div>
        <DrawerFooter className="pt-2"></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function MainContent({ listing, grant, source }: SourceType) {
  const listingLink = React.useCallback(() => {
    if (source === 'listing')
      return `${getURL()}earn/listing/${listing?.slug}/`;
    else return `${getURL()}earn/grants/${grant?.slug}/`;
  }, [source, listing?.slug, grant?.slug]);

  const shareMessage = (
    socialSource?: 'telegram' | 'facebook' | 'linkedin',
  ) => {
    let copy = '';
    if (source === 'grant') {
      copy = `Just came across this massive grant opportunity by ${grant?.sponsor?.name} on Superteam Earn`;
    } else {
      if (listing?.type !== 'project') {
        copy = `Just came across this banger${!!listing?.usdValue ? ` $${listing?.usdValue}` : ''} bounty by ${listing?.sponsor?.name} on Superteam Earn`;
      } else {
        copy = `Just came across this gig by ${listing?.sponsor?.name} on Superteam Earn`;
      }
    }
    if (
      socialSource === 'telegram' ||
      socialSource === 'facebook' ||
      socialSource === 'linkedin'
    ) {
      return encodeURIComponent(`\nCheck this out! ${copy}`);
    }
    return encodeURIComponent(`${copy}! Check it out: \n${listingLink()}`);
  };

  const { hasCopied, onCopy } = useClipboard(listingLink());
  function onListingLinkCopy() {
    posthog.capture('copy_share listing');
    onCopy();
  }

  const shareLinks = React.useMemo(
    () => [
      {
        name: 'X (Twitter)',
        icon: X,
        url: `https://twitter.com/intent/tweet?text=${shareMessage()}`,
        posthog: 'x_share listing',
      },
      {
        name: 'Telegram',
        icon: Telegram,
        url: `https://t.me/share/url?url=${encodeURIComponent(listingLink())}&text=${shareMessage('telegram')}`,
        posthog: 'telegram_share listing',
      },
      {
        name: 'Whatsapp',
        icon: Whatsapp,
        url: `https://api.whatsapp.com/send?text=${shareMessage()}`,
        posthog: 'whatsapp_share listing',
      },
      {
        name: 'LinkedIn',
        icon: Linkedin,
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(listingLink())}&summary=${shareMessage('linkedin')}`,
        posthog: 'linkedin_share listing',
      },
      {
        name: 'Facebook',
        icon: Facebook,
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingLink())}&t=${shareMessage('facebook')}`,
        posthog: 'facebook_share listing',
      },
    ],
    [shareMessage, listingLink],
  );

  const handleShare = React.useCallback((url: string, phEvent: string) => {
    posthog.capture(phEvent);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className={cn('space-y-4 overflow-hidden')}>
      <Button
        variant="secondary"
        className="ph-no-capture group w-full justify-between"
        onClick={onListingLinkCopy}
      >
        <span className="truncate font-normal text-slate-500">
          earn.superteam.fun/{source === 'grant' ? 'grants' : 'listing'}/
          {source === 'grant' ? grant?.slug : listing?.slug}
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
            className="ph-no-capture h-fit w-fit rounded-full p-0!"
            onClick={() => handleShare(platform.url, platform.posthog)}
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
