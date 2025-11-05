import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { useUser } from '@/store/user';

import { sponsorStageQuery } from '@/features/home/queries/sponsor-stage';
import { SponsorStage } from '@/features/home/types/sponsor-stage';

export const SponsorWelcomeVideo = () => {
  const { user } = useUser();
  const { data, isLoading } = useQuery({
    ...sponsorStageQuery,
    enabled: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      setShowVideo(false);
      return;
    }

    setShowVideo(false);
    const timer = setTimeout(() => {
      setShowVideo(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [isModalOpen]);

  if (
    isLoading ||
    !data ||
    !data.stage ||
    (data.stage !== SponsorStage.NEW_SPONSOR &&
      data.stage !== SponsorStage.NEXT_LISTING)
  ) {
    return null;
  }

  const firstName = user?.firstName || '';
  const thumbnailUrl =
    'https://res.cloudinary.com/dgvnuwspr/image/upload/v1761809228/assets/home/sponsor-welcome-thumbnail.webp';
  const videoUrl =
    'https://www.youtube.com/embed/Z7bo-gi7Fa0?si=-qvyHgLoVp4EaWO6&rel=0&modestbranding=1&iv_load_policy=3';

  const layoutId = 'sponsor-welcome-video';

  return (
    <DialogPrimitive.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
      <div className="flex w-full flex-col gap-4 rounded-lg bg-white">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-slate-900">
            Welcome Aboard, {firstName}
          </h2>
          <p className="text-base text-slate-500">
            We&apos;re so glad to have you on our platform. Here&apos;s a
            message from our lead:
          </p>
        </div>

        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            className="group focus-visible:ring-brand-purple relative w-full cursor-pointer rounded-lg focus:outline-none focus-visible:ring-0"
          >
            <motion.div
              layoutId={layoutId}
              className="relative aspect-video w-full overflow-hidden rounded-lg"
              initial={false}
              animate={{
                opacity: isModalOpen ? 0 : 1,
              }}
              transition={{
                opacity: {
                  duration: 0.3,
                  delay: isModalOpen ? 0.4 : 0,
                },
              }}
            >
              <img
                src={thumbnailUrl}
                alt="Sponsor welcome video thumbnail"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                <motion.div
                  className="flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    opacity: isModalOpen ? 0 : 1,
                    scale: isModalOpen ? 0 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Play
                    className="ml-1 text-white"
                    size={40}
                    fill="white"
                    stroke="white"
                  />
                </motion.div>
              </div>
            </motion.div>
          </button>
        </DialogPrimitive.Trigger>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-60 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </DialogPrimitive.Overlay>
            <div className="fixed inset-0 z-61 grid place-items-center outline-none">
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  layoutId={layoutId}
                  className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-lg"
                  initial={false}
                >
                  <img
                    src={thumbnailUrl}
                    alt="Sponsor welcome video thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20">
                    <motion.div
                      className="flex items-center justify-center"
                      initial={{ scale: 1 }}
                      animate={{
                        scale: 0,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Play
                        className="ml-1 text-white"
                        size={40}
                        fill="white"
                        stroke="white"
                      />
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showVideo ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 overflow-hidden rounded-lg"
                  >
                    <iframe
                      width="100%"
                      height="100%"
                      src={showVideo ? `${videoUrl}&autoplay=1` : undefined}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      className="absolute inset-0 border-0"
                      title="Sponsor welcome video"
                    />
                  </motion.div>
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};
