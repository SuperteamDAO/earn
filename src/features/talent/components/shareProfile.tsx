import React from 'react';
import { type IconType } from 'react-icons';
import { FaCheck, FaCopy } from 'react-icons/fa';
import { FaTelegram, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';

import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUser } from '@/store/user';
import { cn } from '@/utils';
import { getURL } from '@/utils/validUrl';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  username: string;
  id: string;
}

interface SocialPlatform {
  name: string;
  icon: IconType;
  share: (url: string, message: string) => void;
}

export const ShareProfile = ({ isOpen, onClose, username, id }: Props) => {
  const [hasCopied, setHasCopied] = React.useState(false);
  const profileUrl = `${getURL()}t/${username}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const { user } = useUser();

  const shareMessage =
    id === user?.id
      ? 'Check out my profile on Superteam Earn!'
      : 'Check out this profile on Superteam Earn!';

  const socialPlatforms: SocialPlatform[] = [
    {
      name: 'Twitter',
      icon: FaXTwitter,
      share: (url, message) => {
        const encodedMessage = encodeURIComponent(message);
        const encodedUrl = encodeURIComponent(url);
        window.open(
          `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
          '_blank',
        );
      },
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      share: (url, message) => {
        const encodedMessage = encodeURIComponent(message);
        const encodedUrl = encodeURIComponent(url);
        window.open(
          `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
          '_blank',
        );
      },
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      share: (url, message) => {
        const encodedMessage = encodeURIComponent(`${message} ${url}`);
        window.open(
          `https://api.whatsapp.com/send?text=${encodedMessage}`,
          '_blank',
        );
      },
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent className="h-max py-5">
        <div className="px-0 py-3 md:px-6">
          <h2 className="text-base font-medium text-slate-900 md:text-lg">
            Share Profile
          </h2>
          <p className="text base mt-3 font-medium text-slate-500 md:text-lg">
            With your friends or on social media to showcase your proof of work,
            all in one place
          </p>
        </div>
        <div className="my-4 border-t border-slate-200" />
        <div className="px-0 md:px-6">
          <div className="relative">
            <Input
              className={cn(
                'pr-12 text-base font-medium text-slate-500 md:text-lg',
                'overflow-hidden text-ellipsis whitespace-nowrap',
                'focus-visible:ring-slate-300',
              )}
              readOnly
              value={profileUrl}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {hasCopied ? (
                <FaCheck className="h-5 w-5 text-slate-500" />
              ) : (
                <FaCopy
                  onClick={onCopy}
                  className="h-5 w-5 cursor-pointer text-slate-500"
                />
              )}
            </div>
          </div>
          <p className="mt-6 text-sm font-medium text-slate-400">SHARE TO</p>
          <div className="mb-4 mt-3 flex gap-4">
            {socialPlatforms.map(({ name, icon: Icon, share }) => (
              <Icon
                key={name}
                className="h-6 w-6 cursor-pointer text-slate-600"
                onClick={() => share(profileUrl, shareMessage)}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
