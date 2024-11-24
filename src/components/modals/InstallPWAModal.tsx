import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { MdIosShare, MdOutlineInstallMobile } from 'react-icons/md';

import { useUser } from '@/store/user';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const ManualInstructions = () => (
  <Box mb={8} py={2} borderRadius={4} bgColor="brand.slate.100">
    <Text align="center">
      点击图标(
      <Icon as={MdIosShare} mr={1} color="brand.purple" fontWeight={600} />
      或 <Icon as={BsThreeDotsVertical} color="brand.purple" />)
      然后选择“添加到主屏幕”选项。
    </Text>
  </Box>
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

    setTimeout(showInstallAppModal, 10000);
  }, [user, onPWAModalOpen]);

  const isAutoInstallable = mobileOs !== 'iOS';

  return (
    <Modal isOpen={isPWAModalOpen} onClose={onPWAModalClose}>
      <ModalOverlay />
      <ModalContent alignSelf="flex-end" mb={0}>
        <ModalHeader borderBottom="1px" borderBottomColor="brand.slate.300">
          <HStack>
            <Icon as={MdOutlineInstallMobile} color={'brand.slate.500'} />
            <Text fontSize={'lg'}>安装 Solar Earn</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton mt={{ base: 2, md: 3 }} />
        <ModalBody>
          <VStack alignItems={'center'} my={4}>
            <Flex align={'center'} direction={'column'} mt={10}>
              <Image
                src={'/android-chrome-512x512.png'}
                alt="Solar Earn Icon"
                height={63}
                width={63}
              />
              <Flex align={'center'} direction={'column'} my={12}>
                <Text fontWeight={700}>不错过任何新的赏金任务</Text>
                <Text w="75%" mt={1} color="brand.slate.500" textAlign="center">
                  将 Solar Earn 添加到主屏幕，并随时更新。
                </Text>
              </Flex>
              {isAutoInstallable ? (
                <Button w={'full'} mt={4} onClick={installApp}>
                  添加到主屏幕
                </Button>
              ) : (
                <ManualInstructions />
              )}
            </Flex>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
