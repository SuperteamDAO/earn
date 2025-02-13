import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { MdIosShare, MdOutlineInstallMobile } from 'react-icons/md';

import { Button } from '@/components/ui/button';
import { PROJECT_NAME } from '@/constants/project';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer';
import { LocalImage } from '../ui/local-image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const ManualInstructions = () => (
  <div className="mb-8 rounded-md bg-slate-100 py-2">
    <p className="text-center">
      Tap these icons (
      <MdIosShare className="mr-1 inline-block font-semibold text-brand-purple" />
      or <BsThreeDotsVertical className="inline-block text-brand-purple" />) and
      select the &quot;Add to home screen&quot; option.
    </p>
  </div>
);

export const InstallPWAModal = () => {
  const { user } = useUser();
  const [mobileOs, setMobileOs] = useState<'Android' | 'iOS' | 'Other'>(
    'Other',
  );

  const {
    isOpen: isPWAModalOpen,
    onClose: onPWAModalClose,
    onOpen: onPWAModalOpen,
  } = useDisclosure();

  const installPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      installPrompt.current = e;
    };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt as EventListener,
    );

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener,
      );
    };
  }, []);

  const installApp = async () => {
    if (installPrompt.current) {
      const { outcome } = await installPrompt.current.prompt();
      if (outcome === 'accepted') {
        localStorage.setItem('isAppInstalled', 'true');
      }
    }
    onPWAModalClose();
  };

  const getMobileOS = (): 'Android' | 'iOS' | 'Other' => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Android';
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
    return 'Other';
  };

  useEffect(() => {
    const showInstallAppModal = () => {
      const modalShown = localStorage.getItem('installAppModalShown');
      const isPWA =
        window.matchMedia('(display-mode: standalone)').matches ||
        document.referrer.includes('android-app://') ||
        (window.navigator as any).standalone;
      const isInstalled = localStorage.getItem('isAppInstalled');
      const os = getMobileOS();
      setMobileOs(os);

      if (os !== 'Other' && !isPWA && !modalShown && !isInstalled) {
        localStorage.setItem('installAppModalShown', 'true');
        onPWAModalOpen();
      }
    };

    setTimeout(showInstallAppModal, 60000);
  }, [user, onPWAModalOpen]);

  const isAutoInstallable = mobileOs !== 'iOS';

  return (
    <Drawer open={isPWAModalOpen} onOpenChange={onPWAModalClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="border-b border-slate-100">
            <DrawerTitle className="flex items-center gap-2">
              <MdOutlineInstallMobile className="text-slate-500" />
              <span className="text-base text-slate-700">
                Install {PROJECT_NAME}
              </span>
            </DrawerTitle>
            <DrawerClose className="absolute right-2 top-7">
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="px-4">
            <div className="my-4 flex flex-col items-center">
              <div className="mt-4 flex flex-col items-center">
                <LocalImage
                  src="/android-chrome-512x512.png"
                  alt={`${PROJECT_NAME} Icon`}
                  className="h-16 w-16"
                />
                <div className="my-12 flex flex-col items-center">
                  <p className="font-bold">Never miss a listing again!</p>
                  <p className="mt-1 w-3/4 text-center text-slate-500">
                    Add {PROJECT_NAME} to your homescreen and always stay
                    updated.
                  </p>
                </div>
                {isAutoInstallable ? (
                  <Button className="mt-4 h-12 w-full" onClick={installApp}>
                    Add to Homescreen
                  </Button>
                ) : (
                  <ManualInstructions />
                )}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
