import { useRouter } from 'next/router';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { Check, Copy, ChevronRight, Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogOverlay
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { tweetEmbedLink } from '@/utils/socialEmbeds';
import { getURL } from '@/utils/validUrl';
import { useUser } from '@/store/user';
import { useClipboard } from '@chakra-ui/react';
import { useListingForm } from '../../hooks';
import { useWatch } from 'react-hook-form';

interface ListingSuccessModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export const ListingSuccessModal = ({
  isOpen,
  onClose,
}: ListingSuccessModalProps) => {
  const { user } = useUser();
  const router = useRouter();

  const form = useListingForm()
  const slug = useWatch({
    control: form.control,
    name: 'slug'
  })
  const type = useWatch({
    control: form.control,
    name: 'type'
  })
  
  const isVerified = useMemo(() => user?.currentSponsor?.isVerified || false, [user]);

  const listingLink = useCallback((medium?: 'twitter' | 'telegram') => 
    `${getURL()}listings/${type}/${slug}/${medium ? `?utm_source=superteamearn&utm_medium=${medium}&utm_campaign=sharelisting` : ``}`,
  [type, slug]);

  const tweetShareContent = `Check out my newly added @SuperteamEarn opportunity!\n\n${listingLink('twitter')}`;
  const twitterShareLink = tweetEmbedLink(tweetShareContent);
  
  const { hasCopied, onCopy } = useClipboard(listingLink());

  const handleViewOrInvite = () => {
    const path = isVerified 
      ? `/dashboard/listings/${slug}/submissions?scout`
      : `/listings/${type}/${slug}`;
    router.push(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent className="overflow-hidden w-full max-w-sm rounded-lg p-0">
        <div className="flex flex-col items-start gap-4 w-full">
          <div className="w-full py-20 bg-emerald-50">
            <div className="mx-auto w-fit p-3 bg-emerald-500 rounded-full">
              <Check className="w-6 h-6 text-white stroke-[3]" />
            </div>
          </div>
          
          <div className="flex flex-col items-start w-full p-6 pt-0 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-700">
                Your Listing is Live
              </h3>
              <p className="text-sm text-slate-500">
                {isVerified
                  ? "Share the love on your socials and invite Earn's best talent!"
                  : "Share the love on your socials!"}
              </p>
            </div>

            <div className="flex flex-col w-full gap-4">
              <Button
                variant="outline"
                className="w-full justify-between group hover:bg-slate-100"
                onClick={onCopy}
              >
                <span className="text-slate-500 font-normal truncate">
                  earn.superteam.fun/listings/{type}/{slug}
                </span>
                {hasCopied ? (
                  <Check className="h-5 w-5 text-slate-400" />
                ) : (
                  <Copy className="h-5 w-5 text-slate-400" />
                )}
              </Button>

              <Button className="w-full gap-2" onClick={handleViewOrInvite}>
                {isVerified ? (
                  <>Invite Talent <Plus className="h-4 w-4" /></>
                ) : (
                  <>View Listing <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>

              <div className="flex justify-between w-full text-sm text-slate-500 font-medium">
                <Link 
                  href={twitterShareLink}
                  target="_blank"
                  className="flex items-center gap-1 hover:text-slate-700"
                >
                  Share on
                  <FaXTwitter className="w-4 h-4" />
                </Link>

                <Link
                  href={isVerified ? `/listings/${type}/${slug}` : '/dashboard/listings/'}
                  className="flex items-center gap-1 hover:text-slate-700"
                >
                  {isVerified ? 'View Listing' : 'Sponsor Dashboard'}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
