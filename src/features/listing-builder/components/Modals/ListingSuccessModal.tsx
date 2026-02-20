import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Check, ChevronRight, Copy, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import FaXTwitter from '@/components/icons/FaXTwitter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useClipboard } from '@/hooks/use-clipboard';
import { tweetEmbedLink } from '@/utils/socialEmbeds';
import { getURL } from '@/utils/validUrl';

import { confirmModalAtom, showFirstPublishSurveyAtom } from '../../atoms';
import { useListingForm } from '../../hooks';
import { Survey } from './Survey';

export const ListingSuccessModal = () => {
  const [confirmModal] = useAtom(confirmModalAtom);
  const shouldShowSurvey = useAtomValue(showFirstPublishSurveyAtom);
  const setShowFirstPublishSurvey = useSetAtom(showFirstPublishSurveyAtom);

  const form = useListingForm();
  const slug = useWatch({
    control: form.control,
    name: 'slug',
  });
  const type = useWatch({
    control: form.control,
    name: 'type',
  });

  const listingLink = useCallback(
    (medium?: 'twitter' | 'telegram') =>
      `${getURL()}earn/listing/${slug}/${medium ? `?utm_source=superteamearn&utm_medium=${medium}&utm_campaign=sharelisting` : ``}`,
    [type, slug],
  );

  const tweetShareContent = `Check out my newly added @SuperteamEarn opportunity!\n\n${listingLink('twitter')}`;
  const twitterShareLink = tweetEmbedLink(tweetShareContent);

  const { hasCopied, onCopy } = useClipboard(listingLink());

  const handleInvite = useMemo(
    () => `/earn/dashboard/listings/${slug}/submissions?scout`,
    [slug],
  );

  return (
    <Dialog open={confirmModal === 'SUCCESS'} onOpenChange={() => null}>
      <DialogContent
        hideCloseIcon
        className="flex max-w-sm flex-col items-start gap-4 overflow-hidden p-0"
      >
        <div className="w-full bg-emerald-50 py-20">
          <div className="mx-auto w-fit rounded-full bg-emerald-500 p-3">
            <Check className="h-6 w-6 stroke-3 text-white" />
          </div>
        </div>

        <div className="flex w-full flex-col items-start space-y-4 p-6 pt-0">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-700">
              Your Listing is Live
            </h3>
            <p className="text-sm text-slate-500">
              {"Share the love on your socials and invite Earn's best talent!"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-4">
            <Button
              variant="outline"
              className="group w-full justify-between hover:bg-slate-100"
              onClick={onCopy}
            >
              <span className="truncate font-normal text-slate-500">
                superteam.fun/earn/listing/{slug}
              </span>
              {hasCopied ? (
                <Check className="h-5 w-5 text-slate-400" />
              ) : (
                <Copy className="h-5 w-5 text-slate-400" />
              )}
            </Button>

            <Link href={handleInvite}>
              <Button className="w-full gap-2">
                <span>Invite Talent</span> <Plus className="h-4 w-4" />
              </Button>
            </Link>

            <div className="flex w-full justify-between text-sm font-medium text-slate-500">
              <Link
                href={twitterShareLink}
                target="_blank"
                className="flex items-center gap-1 hover:text-slate-700"
              >
                Share on
                <FaXTwitter className="h-4 w-4" />
              </Link>

              <Link
                href={`/earn/listing/${slug?.replace(/^[-\s]+|[-\s]+$/g, '')}`}
                className="flex items-center gap-1 hover:text-slate-700"
              >
                {'View Listing'}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {shouldShowSurvey && (
          <Survey
            open={confirmModal === 'SUCCESS' && shouldShowSurvey}
            setOpen={(open) => setShowFirstPublishSurvey(open)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
