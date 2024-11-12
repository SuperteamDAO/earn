import { ExternalLinkIcon, InfoIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Grid,
  IconButton,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Tab,
  TabList,
  Tabs,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  previewUrl: string;
}
export const PreviewListingModal = ({ isOpen, onClose, previewUrl }: Props) => {
  const [tabIndex, setTabIndex] = useState(0); // 0 for Desktop, 1 for Mobile
  const [isLoading, setIsLoading] = useState(true);
  const posthog = usePostHog();

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent bg="white">
        <ModalHeader px="6" py="4">
          <Grid alignItems="center" gap={4} templateColumns="1fr auto 1fr">
            <Text color="brand.slate.500" fontSize="lg" fontWeight="600">
              Preview Listing
            </Text>

            <Tabs
              index={tabIndex}
              onChange={handleTabsChange}
              variant="unstyled"
            >
              <TabList>
                <Tab
                  color="brand.slate.400"
                  fontWeight="600"
                  _selected={{
                    color: 'brand.slate.500',
                    borderBottom: '2px solid',
                    borderColor: 'brand.purple',
                  }}
                >
                  Desktop
                </Tab>
                <Tab
                  color="brand.slate.400"
                  fontWeight="600"
                  _selected={{
                    color: 'brand.slate.500',
                    borderBottom: '2px solid',
                    borderColor: 'brand.purple',
                  }}
                >
                  Mobile
                </Tab>
              </TabList>
            </Tabs>

            <Flex align="center" justifySelf="end" gap="4">
              <Flex align="center">
                <Tooltip
                  aria-label="Preview link tooltip"
                  hasArrow
                  label="This link is for preview purposes only and is accessible only to those who have it. It is not your final link for sharing with your community"
                  placement="top"
                >
                  <IconButton
                    color="brand.slate.300"
                    _hover={{
                      bg: 'none',
                    }}
                    aria-label="Info"
                    icon={<InfoIcon />}
                    variant="ghost"
                  />
                </Tooltip>

                <Button
                  className="ph-no-capture"
                  as={Link}
                  color="brand.slate.500"
                  href={previewUrl}
                  isExternal
                  onClick={() => {
                    posthog.capture('new tab_preview');
                  }}
                  rightIcon={<ExternalLinkIcon />}
                  variant="outlineSecondary"
                >
                  Secret Draft Link
                </Button>
              </Flex>

              <Button
                className="ph-no-capture"
                onClick={() => {
                  posthog.capture('continue editing_preview');
                  onClose();
                }}
                variant="solid"
              >
                Continue Editing
              </Button>
            </Flex>
          </Grid>
        </ModalHeader>
        <ModalBody p="0">
          <Box overflow="hidden" w="80%" h="100%" mx="auto" my={10}>
            <Box
              pos="relative"
              overflow="hidden"
              w={tabIndex === 0 ? '100%' : '420px'}
              h="900px"
              mx="auto"
              borderWidth="2px"
              borderColor="brand.slate.100"
              rounded="lg"
            >
              {isLoading && (
                <Flex
                  pos="absolute"
                  zIndex="1"
                  top="0"
                  left="0"
                  align="center"
                  justify="center"
                  w="100%"
                  h="100%"
                  bg="whiteAlpha.800"
                >
                  <Spinner color="brand.purple" size="xl" />
                </Flex>
              )}
              <iframe
                src={previewUrl + '?preview=1'}
                width="100%"
                height="100%"
                style={{
                  border: 'none',
                  overflow: 'hidden',
                }}
                title="Preview"
                onLoad={() => setIsLoading(false)}
              ></iframe>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
