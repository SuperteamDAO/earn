import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Switch,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { useUser } from '@/store/user';

export const EmailSettingsModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { user, refetchUser } = useUser();

  const posthog = usePostHog();

  const emailSettings = user?.emailSettings || [];

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    emailSettings.map((setting) => setting.category),
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const updateEmailSettings = async () => {
    try {
      posthog.capture('confirm_email preferences');
      setIsUpdating(true);
      await axios.post('/api/user/update-email-settings', {
        categories: selectedCategories,
      });

      await refetchUser();

      setIsUpdating(false);
      onClose();
      toast.success('邮件偏好已更新');
    } catch (error) {
      console.error('Error updating email preferences:', error);
      toast.error('Failed to update email preferences.');
      setIsUpdating(false);
    }
  };

  const showSponsorAlerts = user?.currentSponsorId;
  const showTalentAlerts = user?.isTalentFilled;

  const AlertOption = ({
    title,
    category,
  }: {
    title: string;
    category: string;
  }) => (
    <Flex align="center" justify="space-between">
      <Text mt={1} color="brand.slate.500" fontWeight={500}>
        {title}
      </Text>
      <Switch
        mt={0.5}
        isChecked={selectedCategories.includes(category)}
        onChange={() => handleCategoryChange(category)}
      />
    </Flex>
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent p={2}>
          <ModalCloseButton mt={2} />
          <ModalBody>
            <Text color="brand.slate.700" fontSize="2xl" fontWeight={600}>
              更新邮件偏好
            </Text>
            <Text mt={1} color="brand.slate.400" fontWeight={500}>
              告诉我们您希望接收哪种邮件！
            </Text>
            {showSponsorAlerts && (
              <Box mt={6}>
                <Text
                  mt={6}
                  mb={1}
                  color="brand.slate.400"
                  fontSize="sm"
                  letterSpacing={0.8}
                >
                  项目方推送
                </Text>
                <AlertOption
                  title="已发布任务的新提交"
                  category="submissionSponsor"
                />
                <AlertOption title="已发布任务的新评论" category="commentSponsor" />
                <AlertOption
                  title="截止日期相关提醒"
                  category="deadlineSponsor"
                />
              </Box>
            )}
            {showTalentAlerts && (
              <Box mt={6}>
                <Text
                  mt={6}
                  mb={1}
                  color="brand.slate.400"
                  fontSize="sm"
                  letterSpacing={0.8}
                >
                  TALENT ALERTS
                </Text>
                <AlertOption
                  title="Weekly Roundup of new listings"
                  category="weeklyListingRoundup"
                />
                <AlertOption
                  title="New listings added for my skills"
                  category="createListing"
                />
                <AlertOption
                  title="Likes and comments on my submissions"
                  category="commentOrLikeSubmission"
                />
                <AlertOption
                  title="Sponsor Invitation Emails (Scout)"
                  category="scoutInvite"
                />
              </Box>
            )}
            {(showTalentAlerts || showSponsorAlerts) && (
              <Box mt={6}>
                <Text
                  mt={6}
                  mb={1}
                  color="brand.slate.400"
                  fontSize="sm"
                  letterSpacing={0.8}
                >
                  日常推送
                <AlertOption
                  title="评论回复和艾特"
                  category="replyOrTagComment"
                />
                <AlertOption
                  title="产品更新和通知"
                  category="productAndNewsletter"
                />
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              className="ph-no-capture"
              w="100%"
              colorScheme="blue"
              isLoading={isUpdating}
              loadingText="Updating Preferences.."
              onClick={updateEmailSettings}
            >
              更新偏好
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
